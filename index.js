import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

import { isAuthorized } from './lib/auth.js';
import { sendResponse } from './lib/response.js';
import { sanitizeInput } from './lib/sanitize.js';
import { handleCmd, handleStatus } from './handlers/shell.js';
import { handleLs, handleFind, handleCat } from './handlers/files.js';
import { handleClaude, handleClaudeDir } from './handlers/claude.js';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('\n=== SCAN QR CODE ABOVE ===\n');
    }

    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = reason === DisconnectReason.loggedOut;
      console.log(`Connection closed. Reason: ${reason}. Logged out: ${loggedOut}`);
      if (!loggedOut) {
        console.log('Reconnecting...');
        connectToWhatsApp();
      } else {
        console.log('Logged out. Delete ./auth and restart to re-authenticate.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        await handleMessage(sock, message);
      } catch (err) {
        console.error('Unhandled error in message handler:', err);
      }
    }
  });
}

async function handleMessage(sock, message) {
  // Ignore non-message events, own messages, status broadcasts
  if (!message.message) return;
  if (message.key.fromMe) return;

  const jid = message.key.remoteJid;
  if (!jid) return;
  if (jid === 'status@broadcast') return;
  if (jid.endsWith('@g.us')) return;

  const text =
    message.message.conversation ||
    message.message.extendedTextMessage?.text ||
    '';

  if (!text.startsWith('/')) return;

  if (!isAuthorized(jid)) {
    await sock.sendMessage(jid, { text: '⛔ Unauthorized' });
    return;
  }

  const sanitized = sanitizeInput(text);
  const spaceIdx = sanitized.indexOf(' ');
  const command = spaceIdx === -1 ? sanitized : sanitized.slice(0, spaceIdx);
  const args = spaceIdx === -1 ? '' : sanitized.slice(spaceIdx + 1).trim();

  let result;
  try {
    switch (command.toLowerCase()) {
      case '/cmd':
        result = await handleCmd(args);
        break;
      case '/status':
        result = await handleStatus();
        break;
      case '/ls':
        result = await handleLs(args);
        break;
      case '/find':
        result = await handleFind(args);
        break;
      case '/cat':
        result = await handleCat(args);
        break;
      case '/claude':
        result = await handleClaude(sock, jid, args);
        break;
      case '/claude-dir':
        result = handleClaudeDir(args);
        break;
      case '/restart':
        await sock.sendMessage(jid, { text: 'Restarting...' });
        process.exit(0);
        break;
      default:
        result = { text: `Unknown command: ${command}\nAvailable: /cmd /status /ls /find /cat /claude /claude-dir /restart` };
    }
  } catch (err) {
    result = { text: `Error: ${err.message}` };
  }

  await sendResponse(sock, jid, result);
}

connectToWhatsApp();
