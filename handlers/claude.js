import 'dotenv/config';
import { exec } from 'child_process';
import fs from 'fs';

const CLAUDE_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || '300000', 10);
let claudeWorkingDir = process.env.CLAUDE_WORKING_DIR || process.cwd();

export async function handleClaude(sock, jid, args) {
  if (!args) return { text: 'Usage: /claude <prompt>' };

  await sock.sendMessage(jid, { text: '🤖 Working on it...' });

  return new Promise(resolve => {
    const escaped = args.replace(/"/g, '\\"');
    const child = exec(
      `claude -p "${escaped}"`,
      { timeout: CLAUDE_TIMEOUT_MS, cwd: claudeWorkingDir },
      (err, stdout, stderr) => {
        if (err) {
          if (err.killed) {
            resolve({ text: `🤖 Claude timed out after ${CLAUDE_TIMEOUT_MS / 1000}s` });
          } else {
            resolve({ text: `🤖 Error: ${stderr || err.message}` });
          }
          return;
        }
        resolve({ text: `🤖 ${stdout.trim()}` });
      }
    );
  });
}

export function getClaudeDir() {
  return claudeWorkingDir;
}

export function handleClaudeDir(args) {
  if (!args) return { text: 'Usage: /claude-dir <path>' };

  const p = args.trim();
  if (!fs.existsSync(p)) {
    return { text: `Path does not exist: ${p}` };
  }
  if (!fs.statSync(p).isDirectory()) {
    return { text: `Not a directory: ${p}` };
  }
  claudeWorkingDir = p;
  return { text: `Claude working directory set to: ${p}` };
}
