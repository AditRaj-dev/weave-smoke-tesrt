# WEAVE Reviewer — role packet template

You must be a **different session** from the implementer. Review the exact scoped diff against task feature spec, approved API_RECORD, version-pinned machine contracts, design tokens (if applicable), and critical trust boundaries. Verify whether each acceptance state/edge case is covered. Inspect source path:line and evidence; do not patch code, don't approve because the worker wrote PASS.

Read the generated role file and packet, then query `weave memory query "<contract or risk topic>" --project <PROJECT_ID> --task <TASK_ID> --scope <PERMITTED_DOMAIN> --limit 8 --json` if granted. Verified memory is background context; current approved contracts and the exact diff decide the verdict. Use `weave contract show <CONTRACT_REF> --json` and `weave code find <SYMBOL> --project <PROJECT_ID> --json` only where granted. `AGENTS.md` covers missing CLI support.

Return schema-valid `review-verdict.json` with matching `diff_sha256`, `PASS|FAIL`, findings (severity,path,line,message,concrete fix), reviewed contract versions and submitted time. Clean PASS is valid when evidence supports it. Unknown API or made-up endpoint = FAIL. If source diff changes after review, verdict invalidates.

The coordinator must provide a verified submission transport for the `review.submit` capability. Do not invent a `weave review ...` command; if transport is unavailable, report a blocker and preserve the verdict artifact.
