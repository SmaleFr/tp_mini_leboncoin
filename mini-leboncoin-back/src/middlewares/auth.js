import { unauthorized } from '../lib/errors.js';
import { verifyToken } from '../utils/token.js';
import { isAccessTokenActive } from '../services/accessTokenService.js';
import { getUserById } from '../services/userService.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim();
}

export function requireAuth() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw unauthorized('Authentication required');
      }
      const payload = verifyToken(token);
      const active = await isAccessTokenActive(token);
      if (!active) {
        throw unauthorized('Invalid token');
      }
      if (!payload?.sub) {
        throw unauthorized('Invalid token payload');
      }
      const user = await getUserById(payload.sub);
      req.user = user;
      req.auth = { token, payload };
      next();
    } catch (error) {
      if (error.statusCode === 404 || error.code === 'UNAUTHORIZED' || error.message === 'Token expired' || error.message === 'Invalid token' || error.message === 'Invalid signature') {
        next(unauthorized('Invalid token'));
        return;
      }
      next(error);
    }
  };
}

export function optionalAuth() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return next();
      }
      const payload = verifyToken(token);
      const active = await isAccessTokenActive(token);
      if (!active) {
        return next();
      }
      if (payload?.sub) {
        const user = await getUserById(payload.sub);
        req.user = user;
        req.auth = { token, payload };
      }
      next();
    } catch (error) {
      next(unauthorized('Invalid token'));
    }
  };
}
