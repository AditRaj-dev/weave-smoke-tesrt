"""Validate the local read-only terminal role fixture before a provider launch.

This is an integration probe, not WEAVE's production task-packet validator.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


def main() -> None:
    probe_root = Path(__file__).resolve().parent
    workspace_root = probe_root.parents[2]
    manifest = json.loads(
        (probe_root / "CONTEXT_MANIFEST.probe.json").read_text(encoding="utf-8")
    )
    if manifest["schema_version"] != 1 or manifest["status"] != "probe_only_not_dispatched":
        raise ValueError("unexpected probe manifest version or status")

    for artifact in manifest["artifacts"]:
        path = (probe_root / artifact["path"]).resolve()
        if not path.is_relative_to(probe_root):
            raise ValueError("artifact path escapes probe directory")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != artifact["sha256"]:
            raise ValueError(f"artifact hash mismatch: {artifact['path']}")

    schema = json.loads(
        (workspace_root / "contracts/schemas/task-packet.schema.json").read_text(
            encoding="utf-8"
        )
    )
    packet = json.loads(
        (probe_root / "TASK_PACKET.probe.json").read_text(encoding="utf-8")
    )
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(packet)
    if packet["session_id"] != manifest["session_id"]:
        raise ValueError("session ID mismatch")
    if packet["scopes"]["write_paths"] or packet["tool_permissions"]:
        raise ValueError("probe must remain read-only")
    if packet["isolation_mode"] != "cooperative":
        raise ValueError("probe cannot claim enforced isolation")
    if Path(packet["cwd"]).resolve() != probe_root:
        raise ValueError("probe cwd differs from fixture directory")

    print(f"VALID PROBE: {packet['task_id']} {packet['role']} {packet['session_id']}")


if __name__ == "__main__":
    main()
