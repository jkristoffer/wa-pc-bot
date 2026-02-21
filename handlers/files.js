import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DEFAULT_WORKING_DIR = process.env.DEFAULT_WORKING_DIR || process.cwd();
const FILE_SEARCH_BASE = process.env.FILE_SEARCH_BASE || process.cwd();
const MAX_FIND_RESULTS = parseInt(process.env.MAX_FIND_RESULTS || '20', 10);
const MAX_OUTPUT_CHARS = parseInt(process.env.MAX_OUTPUT_CHARS || '3000', 10);

function resolveSafe(inputPath, base) {
  const resolved = path.resolve(base, inputPath || '');
  if (inputPath && inputPath.includes('..')) {
    throw new Error('Path traversal with ".." is not allowed');
  }
  return resolved;
}

export async function handleLs(args) {
  const targetPath = args ? resolveSafe(args, DEFAULT_WORKING_DIR) : DEFAULT_WORKING_DIR;

  let entries;
  try {
    entries = fs.readdirSync(targetPath, { withFileTypes: true });
  } catch (err) {
    return { text: `Error reading directory: ${err.message}` };
  }

  const lines = entries.map(entry => {
    const icon = entry.isDirectory() ? '📁' : '📄';
    let size = '';
    if (entry.isFile()) {
      try {
        const stat = fs.statSync(path.join(targetPath, entry.name));
        size = ` (${formatSize(stat.size)})`;
      } catch {}
    }
    return `${icon} ${entry.name}${size}`;
  });

  return { text: `${targetPath}\n${lines.join('\n')}` };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function handleFind(args) {
  if (!args) return { text: 'Usage: /find <pattern>' };

  const pattern = args.trim();
  const cmd = `find "${FILE_SEARCH_BASE}" -iname "*${pattern}*" -maxdepth 5`;

  try {
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const results = stdout.trim().split('\n').filter(Boolean).slice(0, MAX_FIND_RESULTS);
    if (results.length === 0) return { text: 'No files found.' };
    return { text: results.join('\n') };
  } catch (err) {
    return { text: `Find error: ${err.message}` };
  }
}

export async function handleCat(args) {
  if (!args) return { text: 'Usage: /cat <file>' };

  let filePath;
  try {
    filePath = resolveSafe(args, DEFAULT_WORKING_DIR);
  } catch (err) {
    return { text: err.message };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { text: `Error reading file: ${err.message}` };
  }

  if (content.length > MAX_OUTPUT_CHARS) {
    return {
      text: `Contents of ${filePath}:`,
      file: Buffer.from(content, 'utf8'),
      filename: path.basename(filePath),
    };
  }

  return { text: `${filePath}\n\n${content}` };
}
