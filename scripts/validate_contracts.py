#!/usr/bin/env python3
"""Small WEAVE starter validator: structural consistency only, not full OpenAPI or runtime validation."""
from pathlib import Path
from collections import Counter
import sys

try:
    import yaml
except ImportError:
    sys.exit("Install PyYAML first: python -m pip install PyYAML")

ROOT = Path(__file__).resolve().parents[1]
api = yaml.safe_load((ROOT / "contracts/openapi.yaml").read_text(encoding="utf-8"))
manifest = yaml.safe_load((ROOT / "contracts/integration-map.yaml").read_text(encoding="utf-8"))
errors = []

if api.get("openapi") != "3.1.0":
    errors.append("Expected OpenAPI 3.1.0 in the starter spec")
if str(api.get("info", {}).get("version")) != str(manifest.get("contract_version")):
    errors.append("Manifest contract_version and OpenAPI info.version differ")
if api.get("info", {}).get("x-weave-contract-state") != manifest.get("contract_state"):
    errors.append("Contract states differ between files")

operations = {}
method_names = {"get", "put", "post", "patch", "delete", "head", "options", "trace"}
ids = []
for path, path_body in (api.get("paths") or {}).items():
    if not path.startswith(manifest.get("conventions", {}).get("api_version_prefix", "/api/v1")):
        errors.append(f"Path lacks configured version prefix: {path}")
    for method, spec in path_body.items():
        if method not in method_names:
            continue
        operation_id = spec.get("operationId")
        if not operation_id:
            errors.append(f"Missing operationId: {method.upper()} {path}")
            continue
        ids.append(operation_id)
        operations[operation_id] = (method.upper(), path)
for operation_id, count in Counter(ids).items():
    if count > 1:
        errors.append(f"Duplicate operationId: {operation_id}")

features = manifest.get("features") or []
feature_ids = [f.get("feature_id") for f in features]
for feature_id, count in Counter(feature_ids).items():
    if count > 1:
        errors.append(f"Duplicate feature_id: {feature_id}")
for feat in features:
    fid = feat.get("feature_id", "<missing feature_id>")
    for dep in feat.get("dependency_ids") or []:
        if dep not in feature_ids:
            errors.append(f"{fid}: unknown feature dependency {dep}")
    for ref in feat.get("operations") or []:
        op = ref.get("operation_id")
        actual = operations.get(op)
        if actual is None:
            errors.append(f"{fid}: unknown operationId {op}")
        elif actual != (str(ref.get("method")).upper(), ref.get("path")):
            errors.append(f"{fid}: {op} expected {actual} but manifest has {(ref.get('method'), ref.get('path'))}")
    for side in ("frontend", "backend"):
        if not feat.get(side, {}).get("task_id"):
            errors.append(f"{fid}: missing {side}.task_id")

# Resolve local JSON pointers, including nested references in responses / schemas.
def walk(node):
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/"):
            current = api
            try:
                for piece in ref[2:].split("/"):
                    current = current[piece.replace("~1", "/").replace("~0", "~")]
            except (KeyError, TypeError):
                errors.append(f"Broken local $ref: {ref}")
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for value in node:
            walk(value)
walk(api)

if errors:
    print("CONTRACT VALIDATION FAILED")
    for err in errors:
        print(" -", err)
    sys.exit(1)
print(f"PASS: {len(operations)} OpenAPI operations, {len(features)} mapped features; versions, mappings and local refs consistent")
print("NOTE: Run full OpenAPI lint, type generation, runtime conformance and E2E checks separately.")
