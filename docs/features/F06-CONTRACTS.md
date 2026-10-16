# F06 — Verified APIs and Frozen FE/BE Contracts

**Priority:** P0 · **Deps:** CON-001

## Behavior
Mastermind `API_RECORD.md` remains ledger for verified third-party APIs, with installed versions/signatures/document evidence. Internal cross-agent contracts live in versioned OpenAPI/JSON Schema. Contract manager approves version hash and generates matching frontend client/server types/mock fixtures; tasks pin contract version. FE/BE do not improvise endpoint path, method, status codes or fields. Changes create new proposal/review/version, regenerate types and notify affected tasks. Build/test gate rejects mismatched endpoint even if both agents say success.

## Acceptance
Two workers pinned AUTH-v1: frontend uses typed mock, backend implements. Deliberately adding `/api/login-v2` fails schema/contract check. Schema revision mid-task results in drift blocking integration, not silent success.
