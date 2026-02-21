import 'dotenv/config';

const MAX_OUTPUT_CHARS = parseInt(process.env.MAX_OUTPUT_CHARS || '3000', 10);

export async function sendResponse(sock, jid, result) {
  const { text, file, filename } = result;

  if (file) {
    if (text) {
      await sock.sendMessage(jid, { text: `\`\`\`\n${text}\n\`\`\`` });
    }
    await sock.sendMessage(jid, {
      document: file,
      mimetype: 'text/plain',
      fileName: filename || 'output.txt',
    });
    return;
  }

  if (text.length <= MAX_OUTPUT_CHARS) {
    await sock.sendMessage(jid, { text: `\`\`\`\n${text}\n\`\`\`` });
  } else {
    const truncated = text.slice(0, MAX_OUTPUT_CHARS);
    const truncMsg = `\`\`\`\n${truncated}\n\`\`\`\n... (truncated, full output attached)`;
    await sock.sendMessage(jid, { text: truncMsg });
    await sock.sendMessage(jid, {
      document: Buffer.from(text, 'utf8'),
      mimetype: 'text/plain',
      fileName: 'output.txt',
    });
  }
}
