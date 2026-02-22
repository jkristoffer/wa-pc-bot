const GREETINGS = [
  "Bot online. Ready to take your commands.",
  "Systems up. Awaiting instructions.",
  "Connection established. What do you need?",
  "Bot started. Type /status for system info.",
  "Online and operational. Ready when you are.",
  "Bot is live. Let's get to work.",
  "Up and running. Send a command to get started.",
  "Connection active. All systems go.",
  "Bot initialized. Waiting for your command.",
  "Ready. Use /cmd, /ls, /cat, /find, or /claude to get started.",
];

export function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}
