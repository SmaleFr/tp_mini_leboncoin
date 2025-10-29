import crypto from 'node:crypto';
import { getCollection } from '../config/mongo.js';
import { internal } from '../lib/errors.js';
import env from '../config/env.js';

function hashAccessToken(token) {
  return crypto.createHmac('sha256', env.tokenSecret).update(token).digest('hex');
}

function accessTokensCollection() {
  return getCollection('accessTokens');
}

export async function persistAccessToken({ token, userId, exp, meta = {} }) {
  try {
    const now = new Date();
    const expiresAt = exp ? new Date(exp * 1000) : new Date(now.getTime() + env.tokenExpiresIn * 1000);
    const doc = {
      tokenHash: hashAccessToken(token),
      userId,
      createdAt: now,
      expiresAt,
      revokedAt: null,
      meta: {
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      },
    };
    await accessTokensCollection().insertOne(doc);
    return { acknowledged: true };
  } catch (err) {
    throw internal('Failed to persist access token');
  }
}

export async function isAccessTokenActive(token) {
  const tokenHash = hashAccessToken(token);
  const now = new Date();
  const doc = await accessTokensCollection().findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: now } }, { projection: { _id: 1 } });
  return Boolean(doc);
}

export async function revokeAccessToken(token) {
  try {
    const tokenHash = hashAccessToken(token);
    return await accessTokensCollection().updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
  } catch (err) {
    throw internal('Failed to revoke access token');
  }
}

