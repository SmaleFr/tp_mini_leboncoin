import { AppError } from '../lib/errors.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  console.error(err);

  const isAppError = err instanceof AppError;
  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const body = { message: err?.message ?? 'Erreur interne' };

  if (env.nodeEnv !== 'production') {
    if (isAppError && err.code) body.code = err.code;
    if (err.details) body.details = err.details;
  }

  res.status(status).json(body);
}
