import { AppError } from '../lib/errors.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : err.statusCode ?? 500;
  const payload = {
    error: isAppError ? err.code : 'INTERNAL',
    message: err.message ?? 'Internal server error',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (env.nodeEnv !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}
