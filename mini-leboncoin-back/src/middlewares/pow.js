import crypto from 'node:crypto';
import env from '../config/env.js';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default function proofOfWork({ difficulty, windowSeconds } = {}) {
  const diff = Number.isFinite(Number(difficulty))
    ? Number(difficulty)
    : Number.parseInt(env.powDifficulty ?? '3', 10);
  const winSec = Number.isFinite(Number(windowSeconds))
    ? Number(windowSeconds)
    : Number.parseInt(env.powWindowSeconds ?? '15', 10);

  const prefix = '0'.repeat(Math.max(1, diff));
  const windowMs = Math.max(1, winSec) * 1000;

  return (req, res, next) => {
    const ts = req.headers['x-timestamp'];
    const fp = req.headers['x-fingerprint'];
    const nonce = req.headers['x-pow-nonce'];
    const solution = req.headers['x-pow-solution'];

    if (!ts || !fp || nonce === undefined || solution === undefined) {
      return res.status(400).json({ message: 'Missing PoW headers' });
    }

    const requestTime = Date.parse(ts);
    if (Number.isNaN(requestTime) || Math.abs(Date.now() - requestTime) > windowMs) {
      return res.status(400).json({ message: 'Request timestamp invalid or expired' });
    }

    const computed = sha256Hex(String(fp) + String(ts) + String(nonce));
    if (computed !== String(solution) || !computed.startsWith(prefix)) {
      return res.status(403).json({ message: 'Invalid PoW solution' });
    }

    req.pow = {
      hash: computed,
      difficulty: prefix.length,
      timestamp: ts,
      fingerprint: fp,
      nonce: String(nonce),
    };

    next();
  };
}

