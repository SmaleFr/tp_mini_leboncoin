import crypto from 'node:crypto';
import env from '../config/env.js';

function toBase64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(data) {
  return crypto.createHmac('sha256', env.tokenSecret).update(data).digest('base64url');
}

export function createToken(payload, { expiresIn } = {}) {
  const headerSegment = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: expiresIn === 0 ? undefined : now + (expiresIn ?? env.tokenExpiresIn),
  };
  const payloadSegment = toBase64Url(JSON.stringify(body));
  const signature = sign(`${headerSegment}.${payloadSegment}`);
  return `${headerSegment}.${payloadSegment}.${signature}`;
}

export function verifyToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid token');
  }
  const [headerSegment, payloadSegment, signature] = segments;
  const expectedSig = sign(`${headerSegment}.${payloadSegment}`);
  const sigBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSig, 'base64url');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(fromBase64Url(payloadSegment));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
