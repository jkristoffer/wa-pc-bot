export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/\0/g, '')
    .slice(0, 10000);
}
