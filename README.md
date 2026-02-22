# wa-pc-bot

A WhatsApp bot for remote PC control via commands.

## Setup

1. Copy `.env` and fill in your values (already configured).
2. Run: `node index.js`
3. Scan the QR code printed to terminal with WhatsApp.

## Commands

| Command | Description |
|---------|-------------|
| `/cmd <command>` | Execute a shell command |
| `/status` | Show hostname, uptime, disk, memory, load |
| `/ls [path]` | List directory contents |
| `/find <pattern>` | Find files by name pattern |
| `/cat <file>` | Read file contents |
| `/claude <prompt>` | Run Claude CLI with prompt |
| `/claude-dir <path>` | Set Claude working directory |
| `/restart` | Restart the bot process (pm2/systemd will revive it) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_NUMBERS` | Comma-separated phone numbers (with +) | — |
| `DEFAULT_WORKING_DIR` | Working dir for /cmd, /ls, /cat | cwd |
| `FILE_SEARCH_BASE` | Base dir for /find | cwd |
| `CLAUDE_WORKING_DIR` | Initial working dir for /claude | cwd |
| `CMD_TIMEOUT_MS` | Timeout for /cmd in ms | 30000 |
| `CLAUDE_TIMEOUT_MS` | Timeout for /claude in ms | 300000 |
| `MAX_OUTPUT_CHARS` | Max chars before file attachment | 3000 |
| `MAX_FIND_RESULTS` | Max results from /find | 20 |

## Persistent Running

**pm2:**
```bash
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

**systemd** (Linux — adjust paths in `wa-bot.service` first):
```bash
sudo cp wa-bot.service /etc/systemd/system/
sudo systemctl enable --now wa-bot
```

## Auth

Auth state is stored in `./auth/`. Delete this directory to re-authenticate.
