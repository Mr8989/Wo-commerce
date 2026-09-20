import crypto from 'node:crypto';
import { promisify } from 'node:util';
import config from '../config.js';

const pbkdf2 = promisify(crypto.pbkdf2);

// Django stores passwords as `pbkdf2_sha256$<iterations>$<salt>$<base64 hash>`.
// Reimplementing that format here means every admin password already in the
// database keeps working, and new ones stay readable by Django if you ever
// need to go back.
const ALGORITHM = 'pbkdf2_sha256';
const KEY_LENGTH = 32; // sha256 digest size, which is Django's default dklen
const SALT_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SALT_LENGTH = 22;

function randomSalt() {
  const bytes = crypto.randomBytes(SALT_LENGTH);
  let salt = '';
  for (const byte of bytes) salt += SALT_CHARS[byte % SALT_CHARS.length];
  return salt;
}

/** Hash a password into Django's encoded format. */
export async function makePassword(rawPassword, { iterations = config.auth.pbkdf2Iterations, salt = randomSalt() } = {}) {
  const derived = await pbkdf2(rawPassword, salt, iterations, KEY_LENGTH, 'sha256');
  return `${ALGORITHM}$${iterations}$${salt}$${derived.toString('base64')}`;
}

/** Verify a password against a Django-encoded hash. */
export async function checkPassword(rawPassword, encoded) {
  if (typeof rawPassword !== 'string' || typeof encoded !== 'string') return false;

  const [algorithm, iterations, salt, hash] = encoded.split('$');
  if (algorithm !== ALGORITHM || !iterations || !salt || !hash) return false;

  const rounds = Number(iterations);
  if (!Number.isInteger(rounds) || rounds < 1) return false;

  const expected = Buffer.from(hash, 'base64');
  const derived = await pbkdf2(rawPassword, salt, rounds, expected.length || KEY_LENGTH, 'sha256');

  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

/** Does this look like a hash rather than a raw password? */
export const isHashed = (value) => typeof value === 'string' && value.startsWith('pbkdf2_');
