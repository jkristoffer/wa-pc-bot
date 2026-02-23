## CONTEXT_VERSION
1

## PROJECT
WhatsApp-based remote PC control bot that executes allowlisted chat commands for shell, file access, status, and Claude CLI prompts.

## TECH_STACK_INTENT
- **Prefer:** Node.js (ES modules), modular command handlers, environment-driven configuration, Baileys WhatsApp integration, pm2/systemd process supervision.
- **Avoid:** Unauthenticated command execution, processing group/status traffic, unrestricted path traversal in file operations.
- **Why:** The project is optimized for lightweight remote operations through WhatsApp while limiting exposure to authorized one-to-one usage.

### Exceptions
- `/restart` intentionally exits the process so an external supervisor (pm2/systemd) can revive it.

## NON-GOALS
- Multi-user role/permission model beyond an allowlist of phone numbers.
- Group chat command workflows (group messages are ignored).
- Rich application UI beyond WhatsApp command/response interactions.

## INVARIANTS
- Only messages that start with `/` are treated as commands.
- Commands execute only for senders in `ALLOWED_NUMBERS`.
- Status broadcasts and group chats are ignored.
- Auth/session state persists in `./auth` using Baileys multi-file auth.
- Command/file outputs must be bounded (`MAX_OUTPUT_CHARS`) and may be sent as file attachments when large.

## CONSTRAINTS
- **Runtime:** Node.js (`type: module`), local shell access, WhatsApp Web session connectivity.
- **Version locks:** `package-lock.json` present; dependency versions pinned via npm lockfile.
- **External APIs:** WhatsApp Web via `@whiskeysockets/baileys`; local `claude` CLI invocation for `/claude`.

## ARCH_INTENT
- **Boundaries:** `index.js` owns WhatsApp connection lifecycle and command routing; `handlers/` owns command domain logic (`shell`, `files`, `claude`, `greetings`); `lib/` owns cross-cutting concerns (`auth`, input sanitization, response formatting); `.env` controls operational policy (allowlist, timeouts, working directories, output/result limits).

## AI_RULES
- Minimal diffs
- Ask before adding dependencies
- Do not refactor unrelated code
- Follow existing patterns

## EXTENSIONS
<!-- Project-specific additions; informational unless referenced -->
- Deployment can be supervised by either pm2 (`ecosystem.config.cjs`) or systemd (`wa-bot.service`).

## UNANSWERED
<!-- Ambiguities that would benefit from human clarification -->
- What Node.js major/minor version is the supported production baseline? (`<unknown>`)
- Should `/cmd` and `/claude` be further restricted (allowlisted commands, sandboxed execution, audit logging)? (`<infer>`)
- Is Linux systemd the canonical deployment target, or should macOS/local-only operation be treated as primary? (`<unknown>`)
