#!/usr/bin/env python3
"""Render a reviewable WEAVE role bundle; this does not dispatch a CLI session."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys

from jsonschema import Draft202012Validator, FormatChecker, ValidationError


ROOT = Path(__file__).resolve().parents[1]
PLACEHOLDER = re.compile(r"\{\{([A-Z_]+)\}\}")
TEXT_BLOCK = re.compile(r"```text\s*\n(.*?)\n```", re.DOTALL)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def render(template: str, values: dict[str, str]) -> str:
    missing = sorted(set(PLACEHOLDER.findall(template)) - values.keys())
    if missing:
        raise ValueError(f"missing template values: {', '.join(missing)}")
    return PLACEHOLDER.sub(lambda match: values[match.group(1)], template)


def text_block(path: Path) -> str:
    match = TEXT_BLOCK.search(path.read_text(encoding="utf-8"))
    if match is None:
        raise ValueError(f"missing text block in {path}")
    return match.group(1) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    packet_bytes = args.packet.read_bytes()
    packet = json.loads(packet_bytes)
    schema = json.loads((ROOT / "contracts/schemas/task-packet.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(packet)

    mapping = json.loads((ROOT / "config/role-prompts.json").read_text(encoding="utf-8"))
    if mapping.get("schema_version") != 1:
        raise ValueError("unsupported role prompt mapping version")
    role_paths = mapping["roles"].get(packet["role"])
    if not role_paths:
        raise ValueError(f"no prompt mapping for role {packet['role']!r}")

    output = args.output.resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError(f"output directory must be empty: {output}")

    packet_path = output / "TASK_PACKET.json"
    role_path = output / "ROLE.md"
    manifest_path = output / "CONTEXT_MANIFEST.json"
    initial_path = output / "INITIAL_MESSAGE.txt"
    pointer_path = output / "PROVIDER_POINTER.txt"

    prompt_parts = []
    for relative in role_paths:
        source = (ROOT / relative).resolve()
        if not source.is_relative_to(ROOT) or not source.is_file():
            raise ValueError(f"invalid mapped prompt path: {relative}")
        prompt_parts.append(source.read_text(encoding="utf-8").strip())

    report_path = Path(packet["report_destination"])
    if not report_path.is_absolute():
        report_path = Path(packet["worktree"]) / report_path
    values = {
        "ABSOLUTE_PACKET_PATH": str(packet_path),
        "ABSOLUTE_ROLE_PATH": str(role_path),
        "ABSOLUTE_CONTEXT_MANIFEST_PATH": str(manifest_path),
        "PACKET_HASH": digest(packet_bytes),
        "PROJECT_ID": packet["project_id"],
        "RUN_ID": packet["run_id"],
        "SESSION_ID": packet["session_id"],
        "TASK_ID": packet["task_id"],
        "WORKTREE_PATH": packet["worktree"],
        "ROLE": packet["role"],
        "PROVIDER": packet["provider"],
        "FEATURE_SPEC": packet["feature_spec"],
        "READ_SET": ", ".join(packet["scopes"]["read_paths"]) or "none",
        "WRITE_PATHS": ", ".join(packet["scopes"]["write_paths"]) or "none",
        "CONTRACTS": json.dumps(packet["contracts"], separators=(",", ":")),
        "VERIFICATION_COMMANDS": "; ".join(packet["verification_commands"]) or "none",
        "TOOLS": ", ".join(packet["tool_permissions"]) or "none",
        "MEMORY_DOMAINS_AND_TOPICS": (
            "scopes=" + (", ".join(packet["memory_scopes"]) or "none")
            + "; acceptance=" + ("; ".join(packet["acceptance_criteria"]) or "none")
        ),
        "REPORT_PATH": str(report_path),
        "ROLE_GUIDANCE": "\n\n".join(prompt_parts),
    }

    role_text = render((ROOT / "templates/TASK_PACKET_INSTRUCTIONS.md").read_text(encoding="utf-8"), values)
    role_bytes = role_text.encode("utf-8")
    values["ROLE_HASH"] = digest(role_bytes)
    initial_text = render(text_block(ROOT / "templates/CLI_STARTUP_MESSAGE.md"), values)
    pointer_text = render(text_block(ROOT / "templates/PROVIDER_INSTRUCTION_POINTER.md"), values)

    output.mkdir(parents=True, exist_ok=True)
    packet_path.write_bytes(packet_bytes)
    role_path.write_bytes(role_bytes)
    manifest = {
        "schema_version": 1,
        "project_id": packet["project_id"],
        "run_id": packet["run_id"],
        "task_id": packet["task_id"],
        "session_id": packet["session_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "preview_only_not_dispatched",
        "read_paths": packet["scopes"]["read_paths"],
        "artifacts": [
            {"path": packet_path.name, "sha256": values["PACKET_HASH"]},
            {"path": role_path.name, "sha256": values["ROLE_HASH"]},
        ],
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    initial_path.write_text(initial_text, encoding="utf-8")
    pointer_path.write_text(pointer_text, encoding="utf-8")
    print(json.dumps({"status": manifest["status"], "role": packet["role"], "output": str(output)}))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, json.JSONDecodeError, ValidationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
