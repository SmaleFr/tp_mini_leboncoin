import crypto from 'node:crypto';

const SALT_BYTES = 32;

export function generateSalt() {
  return crypto.randomBytes(SALT_BYTES).toString('hex');
}

export function hashPassword(password, salt = generateSalt()) {
  if (!password || password.length < 8) {
    throw new Error('Password must contain at least 8 characters');
  }
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  try {
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch (error) {
    return false;
  }
}
