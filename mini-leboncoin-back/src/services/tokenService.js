import crypto from 'node:crypto';
import env from '../config/env.js';
import { getCollection } from '../config/mongo.js';
import { toObjectId } from '../utils/objectId.js';
import { internal } from '../lib/errors.js';

function hashRefreshToken(token) {
  return crypto.createHmac('sha256', env.tokenSecret).update(token).digest('hex');
}

function refreshTokensCollection() {
  return getCollection('refreshTokens');
}

export async function createRefreshToken(userId, { userAgent, ip } = {}) {
  const value = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashRefreshToken(value);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (env.refreshTokenExpiresIn ?? 259200) * 1000);

  const doc = {
    userId: toObjectId(userId, 'userId'),
    tokenHash,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    meta: {
      userAgent: userAgent ?? null,
      ip: ip ?? null,
    },
  };

  try {
    await refreshTokensCollection().insertOne(doc);
    return value; // retour uniquement valeur
  } catch (err) {
    throw internal('Failed to issue refresh token');
  }
}

export async function findValidRefreshToken(token) {
  if (!token) return null;
  const tokenHash = hashRefreshToken(token);
  const now = new Date();
  const doc = await refreshTokensCollection().findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: now },
  });
  return doc;
}

export async function revokeRefreshToken(token) {
  if (!token) return { acknowledged: true, modifiedCount: 0 };
  const tokenHash = hashRefreshToken(token);
  try {
    return await refreshTokensCollection().updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  } catch (err) {
    throw internal('Failed to revoke refresh token');
  }
}

