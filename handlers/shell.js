import 'dotenv/config';
import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CMD_TIMEOUT_MS = parseInt(process.env.CMD_TIMEOUT_MS || '30000', 10);
const DEFAULT_WORKING_DIR = process.env.DEFAULT_WORKING_DIR || process.cwd();

export async function handleCmd(args) {
  if (!args) return { text: 'Usage: /cmd <command>' };

  try {
    const { stdout, stderr } = await execAsync(args, {
      timeout: CMD_TIMEOUT_MS,
      cwd: DEFAULT_WORKING_DIR,
    });
    const output = (stdout + (stderr ? `\nSTDERR:\n${stderr}` : '')).trim();
    return { text: output || '(no output)' };
  } catch (err) {
    const msg = err.killed
      ? `Command timed out after ${CMD_TIMEOUT_MS}ms`
      : (err.stdout || '') + (err.stderr ? `\nSTDERR:\n${err.stderr}` : '') || err.message;
    return { text: msg.trim() || err.message };
  }
}

export async function handleStatus() {
  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = `${days}d ${hours}h ${mins}m`;

  const freeMem = (os.freemem() / 1024 / 1024).toFixed(1);
  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(1);
  const load = os.loadavg().map(l => l.toFixed(2)).join(', ');

  let disk = '';
  try {
    const { stdout } = await execAsync('df -h /', { timeout: 5000 });
    disk = stdout.trim();
  } catch {
    disk = 'unavailable';
  }

  const text = [
    `Hostname:    ${os.hostname()}`,
    `Uptime:      ${uptimeStr}`,
    `Memory:      ${freeMem}MB free / ${totalMem}MB total`,
    `Load avg:    ${load}`,
    `Disk (df -h /):`,
    disk,
  ].join('\n');

  return { text };
}
