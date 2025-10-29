import asyncHandler from '../utils/asyncHandler.js';
import { badRequest, unauthorized } from '../lib/errors.js';
import { createToken, verifyToken } from '../utils/token.js';
import { createRefreshToken, findValidRefreshToken, revokeRefreshToken } from '../services/tokenService.js';
import { persistAccessToken, revokeAccessToken } from '../services/accessTokenService.js';

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    throw badRequest('refreshToken is required');
  }
  const doc = await findValidRefreshToken(refreshToken);
  if (!doc) {
    throw unauthorized('Invalid refresh token');
  }
  const accessTtl = 60; 
  const token = createToken({ sub: doc.userId.toString() }, { expiresIn: accessTtl });
  const payload = verifyToken(token);
  await persistAccessToken({
    token,
    userId: doc.userId,
    exp: payload?.exp,
    meta: { userAgent: req.headers['user-agent'], ip: req.ip },
  });
  res.json({ token });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    throw badRequest('refreshToken is required');
  }
  await revokeRefreshToken(refreshToken);
  const header = req.headers.authorization;
  const token = typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;
  if (token) {
    await revokeAccessToken(token);
  }
  res.status(204).end();
});
