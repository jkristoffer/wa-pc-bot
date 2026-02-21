import 'dotenv/config';

const allowed = (process.env.ALLOWED_NUMBERS || '')
  .split(',')
  .map(n => n.trim().replace(/^\+/, ''));

export function isAuthorized(senderJid) {
  const number = senderJid.replace(/@s\.whatsapp\.net$/, '');
  return allowed.includes(number);
}
