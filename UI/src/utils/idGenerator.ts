/**
 * Generate a short, human-friendly ID (8 uppercase alphanumeric characters).
 *
 * Produces codes like "7K3X4MBN" that are easy to read aloud and type on a phone.
 * Uses timestamp + counter + randomness for collision resistance.
 */

const ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I to avoid ambiguity
let lastTimestamp = 0;
let counter = 0;

export function generateId(): string {
  const now = Date.now();
  if (now === lastTimestamp) {
    counter++;
  } else {
    lastTimestamp = now;
    counter = 0;
  }

  let result = '';
  let seed = now + counter;
  for (let i = 0; i < 4; i++) {
    result += ID_CHARS[seed % ID_CHARS.length];
    seed = Math.floor(seed / ID_CHARS.length);
  }
  seed = Math.floor(Math.random() * 1_000_000_000);
  for (let i = 0; i < 4; i++) {
    result += ID_CHARS[seed % ID_CHARS.length];
    seed = Math.floor(seed / ID_CHARS.length);
  }
  return result;
}
