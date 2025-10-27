export class AppError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? 'APP_ERROR';
    if (details) {
      this.details = details;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export function badRequest(message, options) {
  return new AppError(400, message ?? 'Bad request', { code: 'BAD_REQUEST', ...options });
}

export function unauthorized(message, options) {
  return new AppError(401, message ?? 'Unauthorized', { code: 'UNAUTHORIZED', ...options });
}

export function forbidden(message, options) {
  return new AppError(403, message ?? 'Forbidden', { code: 'FORBIDDEN', ...options });
}

export function notFound(message, options) {
  return new AppError(404, message ?? 'Not found', { code: 'NOT_FOUND', ...options });
}

export function conflict(message, options) {
  return new AppError(409, message ?? 'Conflict', { code: 'CONFLICT', ...options });
}

export function unprocessable(message, options) {
  return new AppError(422, message ?? 'Unprocessable entity', { code: 'UNPROCESSABLE', ...options });
}

export function internal(message, options) {
  return new AppError(500, message ?? 'Internal server error', { code: 'INTERNAL', ...options });
}
