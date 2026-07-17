const PREFIX = '#fez';

export function logFez(message, details) {
  if (details === undefined) {
    console.log(PREFIX, message);
    return;
  }
  console.log(PREFIX, message, details);
}
