"""Checks for the offline prompt bundle preview."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
RENDERER = ROOT / "scripts/render_agent_bundle.py"
SAMPLE = ROOT / "examples/task-packet.json"


class RenderAgentBundleTests(unittest.TestCase):
    def run_renderer(self, packet: Path, output: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(RENDERER), "--packet", str(packet), "--output", str(output)],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_role_mapping_covers_configured_agents(self) -> None:
        configured = {
            role["id"]
            for role in yaml.safe_load((ROOT / "config/roles.yaml").read_text(encoding="utf-8"))["roles"]
        }
        mapping = json.loads((ROOT / "config/role-prompts.json").read_text(encoding="utf-8"))["roles"]
        self.assertEqual(configured, set(mapping))
        for paths in mapping.values():
            for relative in paths:
                self.assertTrue((ROOT / relative).is_file(), relative)

    def test_rendered_bundle_is_hashed_and_cannot_be_overwritten(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "bundle"
            first = self.run_renderer(SAMPLE, output)
            self.assertEqual(first.returncode, 0, first.stderr)

            packet_bytes = (output / "TASK_PACKET.json").read_bytes()
            role_bytes = (output / "ROLE.md").read_bytes()
            manifest = json.loads((output / "CONTEXT_MANIFEST.json").read_text(encoding="utf-8"))
            self.assertEqual(packet_bytes, SAMPLE.read_bytes())
            self.assertEqual(manifest["status"], "preview_only_not_dispatched")
            self.assertEqual(manifest["task_id"], "BE-014")
            self.assertEqual(
                manifest["artifacts"],
                [
                    {"path": "TASK_PACKET.json", "sha256": hashlib.sha256(packet_bytes).hexdigest()},
                    {"path": "ROLE.md", "sha256": hashlib.sha256(role_bytes).hexdigest()},
                ],
            )
            self.assertIn("WEAVE Backend Agent", role_bytes.decode("utf-8"))
            self.assertIn("WEAVE Coding Agent", role_bytes.decode("utf-8"))
            initial = (output / "INITIAL_MESSAGE.txt").read_text(encoding="utf-8")
            self.assertIn(str(output / "ROLE.md"), initial)
            self.assertIn(hashlib.sha256(role_bytes).hexdigest(), initial)
            self.assertNotIn("{{", initial)

            second = self.run_renderer(SAMPLE, output)
            self.assertNotEqual(second.returncode, 0)
            self.assertIn("must be empty", second.stderr)
            self.assertEqual(role_bytes, (output / "ROLE.md").read_bytes())

    def test_unknown_role_does_not_write_bundle(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            packet = json.loads(SAMPLE.read_text(encoding="utf-8"))
            packet["role"] = "unconfigured_role"
            source = Path(tmp) / "packet.json"
            source.write_text(json.dumps(packet), encoding="utf-8")
            output = Path(tmp) / "bundle"
            result = self.run_renderer(source, output)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("no prompt mapping", result.stderr)
            self.assertFalse(output.exists())

    def test_every_configured_role_renders(self) -> None:
        roles = json.loads((ROOT / "config/role-prompts.json").read_text(encoding="utf-8"))["roles"]
        with tempfile.TemporaryDirectory() as tmp:
            for role in roles:
                with self.subTest(role=role):
                    packet = json.loads(SAMPLE.read_text(encoding="utf-8"))
                    packet["role"] = role
                    source = Path(tmp) / f"{role}.json"
                    source.write_text(json.dumps(packet), encoding="utf-8")
                    output = Path(tmp) / role
                    result = self.run_renderer(source, output)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    rendered = (output / "ROLE.md").read_text(encoding="utf-8")
                    self.assertNotIn("{{", rendered)
                    self.assertIn(f"Role: `{role}`", rendered)


if __name__ == "__main__":
    unittest.main()
