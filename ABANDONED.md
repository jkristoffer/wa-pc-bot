# ⚠️ PROJECT ABANDONED

This project is **no longer maintained** and serves only as a proof-of-concept. It has been shelved due to critical security vulnerabilities and architectural risks that make it unsuitable for production use.

## Security Issues

### 🔴 CRITICAL: Command Injection in `/find` Handler

**Location:** `handlers/files.js:57`

**Vulnerability:**
```javascript
const cmd = `find "${FILE_SEARCH_BASE}" -iname "*${pattern}*" -maxdepth 5`;
```

User-supplied pattern is directly interpolated into a shell command string. An authorized user can inject arbitrary shell commands:

- `/find test$(whoami)` → executes `whoami` in the shell
- `/find test\`id\`` → executes `id` command
- `/find test; rm -rf /` → chains destructive commands

**Impact:** Complete shell command execution bypass through what appears to be a "safe" file search utility.

### 🟡 MEDIUM: Unrestricted Shell Execution via `/cmd`

**Location:** `handlers/shell.js:19`

The `/cmd` handler passes user input directly to `exec()` with minimal validation:
```javascript
const { stdout, stderr } = await execAsync(args, { ... });
```

While this is arguably the *intended* design for "remote PC control," there are no restrictions on what commands can be executed. An authorized user can run any command on the system.

**Mitigation:** This would require an allowlisted command model or sandboxing approach.

### 🟡 MEDIUM: Path Traversal Partially Mitigated

**Location:** `handlers/files.js` (both `/ls` and `/cat`)

The `resolveSafe()` function blocks `..` sequences but only at the string-matching level:
```javascript
if (inputPath && inputPath.includes('..')) {
  throw new Error('Path traversal with ".." is not allowed');
}
```

This could be circumvented with symlinks or other path tricks. Modern alternatives like `path.relative()` validation would be more robust.

## Why This Project Cannot Be Salvaged

1. **Allowlist-based authorization is the only gate** — Once someone is in the allowlist, they have near-total system access. There's no granular permission model.

2. **Command injection is endemic to the architecture** — Shelling out to `find` or accepting arbitrary commands in `/cmd` means the entire system boundary is thin.

3. **No audit logging or accountability** — Commands execute silently with no record of who ran what or when.

4. **WhatsApp as a control surface** — Session state depends on Baileys maintaining compatibility with WhatsApp Web's unstable API. Any breaking change breaks the bot entirely.

5. **No sandboxing or resource limits** — Commands can consume unlimited resources, fork processes, etc.

## Lessons Learned

- **Never interpolate user input into shell commands.** Use `execFile()` with argument arrays instead of `exec()` with strings.
- **Command allowlisting > command injection prevention.** If you must accept user commands, only allow a whitelist of pre-defined operations.
- **Boundary security > internal validation.** The real risk is at the auth boundary (WhatsApp number allowlist), not within handler logic.
- **White-label remote access is hard.** Tools like Tailscale, SSH with bastion hosts, or purpose-built remote access platforms are battle-tested. Rolling your own introduces risks.

## References

- [OWASP: Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [CWE-78: Improper Neutralization of Special Elements used in an OS Command](https://cwe.mitre.org/data/definitions/78.html)

---

**Status:** Archived as POC only. Do not deploy to production.
