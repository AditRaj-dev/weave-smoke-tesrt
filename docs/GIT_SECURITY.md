# Git Broker, Workspace Isolation, Security

## 1. Git mutation authority
Only daemon `git-broker` is **authorized by WEAVE policy** to create/remove worktrees, switch branches, stage, commit, cherry-pick/merge, reset, push and finish branches. Worker reports never trigger Git commands directly without complete gate validation.

**Critical limitation:** same-user local agents running an unrestricted shell can bypass any prompt telling them not to execute Git commands or edit `.git`. Until OS sandbox/ACL protection is demonstrated, UI must label isolation **COOPERATIVE POLICY**, not security-enforced. An audit detecting unauthorized changes is not preventive containment.

## 2. Lifecycle
1. Broker creates `weave/<run-id>` integration branch only after checking dirty-tree policy and owner confirmation where needed.
2. For every writable task, broker creates a **unique** worktree branch `weave/task/<task-id>-<attempt>` under an app-managed workspace, never inside another worktree.
3. Worker writes ordinary project files in its worktree. Broker audits changed file paths vs scope, checks Git metadata integrity and unauthorized refs. Worker may use read-only Git status commands only as configured.
4. Worker emits task report, reviewer gets diff hash + spec, tester runs verifications.
5. Broker creates a scoped commit only after PASS verdicts; integrates one task at a time via merge/cherry-pick strategy recorded in event, reruns necessary integration checks on integration branch.
6. If conflict or test regression, abort integration, preserve task worktree, emit detailed blocker; don't auto-force merge.
7. Cleanup only after integrated hash confirmed. `push`, `merge into main`, destructive reset and `discard` explicitly human gated.

## 3. Git operation preconditions
- Matching run/task IDs and integration branch lineage.
- Task marked `integration_ready`, no unresolved blockers; frozen contract pins still valid.
- Report schema valid, declared files match actual changed paths, no unauthorized `.git` changes.
- Reviewer **not equal** implementer session; reviewer PASS with matching diff hash.
- Tester PASS with matching commit/diff hash and fresh commands.
- Owner policy approval for remote/destructive operation and branch target.
- Audit entry `planned` persisted before Git side effects; reconcile on restart.

## 4. Secrets and tools
A worker may read local files it has permission for; no zero-trust isolation is claimed. Implement deliberate deny rules for `.env*`, credential stores, SSH keys, browser profiles, daemon IPC secret and other-project paths; restrict env variables; move secrets out of writable worktrees. Do not store vendor auth tokens in SQLite. On native Windows evaluate restricted tokens/ACLs/Job Objects vs sandbox process restrictions; verify `.git` indirection and shared metadata path. On Unix investigate namespace/container isolation for enforcement.

## 5. Threat models
- **Accidental worker misbehavior**: file scopes, contracts, independent reviews, Git broker audit generally mitigate.
- **Prompt-injection in tool output**: treat memory/source/browser/CLI output as data; require authorization and schema-based command routing.
- **Malicious agent subprocess**: prompt instructions and workspace paths are insufficient. Mark as out-of-scope for MVP hard guarantees; implement OS isolation before calling system secure against malicious workers.
- **Same-user malicious processes**: per-user IPC secret/ACL does not fully protect against same-user adversary. Document limitation.
- **Data loss**: backups, transactional ledger, reconciliation, no destructive operations without human approval.

## 6. Test cases
Attempt worker `git commit`, tamper `.git` path, edit outside allowed scope, overwrite contract schema, use invalid diff hash, try merge after failing test, attempt duplicate integration request, force push without approval. Report actual `prevented|detected|not mitigated`; never turn `detected` into `prevented` in documentation.
