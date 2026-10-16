# Terminal role and prompt delivery probe

**Status:** Manual integration probe, 2026-10-16. This is not a dispatched WEAVE task, daemon-owned session, provider adapter, or PTY-001 acceptance result.

The separate [Windows ConPTY transport spike](conpty-spike/README.md) now verifies PTY creation, input, cursor-query response, resize, role-file output, and shell exit with stored redacted command evidence. The Antigravity and Codex experiments below verify interactive CLI role-file reading; neither path is yet a WEAVE daemon session.

## Tested sequence

1. Created [ROLE.md](ROLE.md) with a read-only `reviewer` role and a marker that was absent from the terminal prompt. SHA-256: `d484717eb258d678cd1d2618e102cc79a5e6e6e861500db615bc956b542aa8d5`.
2. Opened a new PTY-backed terminal in this directory using `exec_command` with `tty: true`. The launched command was `agy --mode=plan --sandbox`.
3. Once the Antigravity interactive prompt was ready, sent the terminal input through `write_stdin`: `Read ROLE.md in the current directory. Follow its read-only reviewer role probe and reply with the assigned role and marker in one short line. Do not edit files.` followed by Enter.
4. The terminal displayed that Antigravity explored `ROLE.md` and replied with assigned role `reviewer` and the file's marker. The raw terminal stream contained account and process-title data, so it was not stored as an evidence artifact. The coordinator inspected only a filtered stream and verified the role file was unchanged. Antigravity was exited with `/exit`; the terminal process returned exit code 0.

The installed Antigravity CLI reported version `1.4.0` after the run; the observation and role hash were recorded at `2026-10-16T11:41:59Z` (17:11:59 Asia/Calcutta). The tool session handle was `78051`. This is **manual evidence** of launching an interactive CLI and delivering a role-file pointer over terminal input. It does not meet `AGENTS.md`'s stored command-output requirement for a formal task test.

## Provider failure observed

The first interactive probe used `gemini --approval-mode plan --skip-trust --screen-reader` in a PTY. Gemini CLI reported that its individual Code Assist client was no longer supported and stayed at authentication selection; the prompt was not processed. The session was exited without tool calls. It reported version `0.56.0` before launch and `0.64.0` after its automatic update. Treat this provider as `auth_required`/unavailable until a fresh version-specific probe succeeds; do not infer that the same input path works for it.

## Codex CLI provider probe

Codex CLI `0.155.1` is in the WEAVE provider list. An initial PTY launch with `TERM=dumb` failed immediately with exit code 1 and the explicit error that the interactive TUI requires a supported terminal. A second PTY launch set `TERM=xterm-256color` and used `codex -C <this-directory> -s read-only -a never --no-alt-screen`. After the local trust prompt was accepted, the coordinator sent the same role-file prompt over terminal input. Codex read `ROLE.md` and replied `Role: reviewer — WEAVE_REVIEWER_ROLE_PROBE_7C42`; `/exit` terminated the process with exit code 0. The session handle was `89668`; completion was observed by 2026-10-16T11:51:07Z. No local `.codex` configuration directories existed in this path; global startup hooks were still loaded. The role file hash remained unchanged.

This confirms manual interactive role-pointer delivery for one provider named by `task-packet.schema.json`. It does not establish a WEAVE provider adapter, packet hash verification, daemon supervision, or safe instruction precedence. As with the Antigravity run, raw TUI output was not saved because terminal process-title and account data can be sensitive.

## Schema-valid packet and hash preflight

A second, synthetic fixture adds [TASK_PACKET.probe.json](TASK_PACKET.probe.json), [ROLE_PACKET_PROBE.md](ROLE_PACKET_PROBE.md), [CONTEXT_MANIFEST.probe.json](CONTEXT_MANIFEST.probe.json), and the exact [initial message](INITIAL_MESSAGE.probe.txt). The packet validates against `contracts/schemas/task-packet.schema.json` v1, has no write paths or tool permissions, and is explicitly marked cooperative. Its `worktree` value points to this ordinary directory only because the schema requires a string; it does **not** prove a Git worktree exists. The coordinator ran `python docs/parallel-agents/terminal-role-probe/validate_probe.py` (exit 0; [stored preflight log](../agy-runs/review-probe-validator.log)) before launching the provider. The validator checks schema, session ID, scope, path containment, and SHA-256 of the packet and role files.

Codex CLI automatically updated from 0.155.1 to 0.163.0 before the first attempt could process this second prompt. After rechecking `codex --help`, the coordinator opened a fresh read-only PTY using `TERM=xterm-256color` and `codex -C <fixture-directory> -s read-only -a never --no-alt-screen`. The initial message was sent as terminal input after startup. Codex displayed reads of both the role and packet files and replied `PROBE-ROLE-001 reviewer WEAVE_PACKET_ROLE_PROBE_9A31`; `/exit` returned process exit code 0. The tool session handle was `23081`, observed by 2026-10-16T12:13:28Z. Raw TUI output was filtered during review and not retained as formal test evidence.

This checks the manual path from deterministic packet/hash preflight to interactive prompt delivery. Production still needs a daemon-owned Windows ConPTY, a real brokered worktree, packet/version enforcement, provider capability probe, control-token ownership, event stream, and reconnect behavior.

## WEAVE implementation boundary

The production path specified by `docs/PROTOCOLS.md` is: validate an immutable task packet and role file; probe the installed provider; create a daemon-owned Windows ConPTY in an allowed worktree; start the provider with an argument vector; send the short startup message as terminal input once the CLI is ready; attach output/events to the session ID; enforce control-token ownership and bounded output; report errors such as missing provider or authentication. None of the daemon ownership, worktree, token, event, resize, reconnect, or output retention behavior was exercised by this manual probe.
