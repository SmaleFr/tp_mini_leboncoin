import { notFound } from '../lib/errors.js';

export default function notFoundMiddleware(req, res, next) {
  next(notFound(`Route ${req.originalUrl} not found`));
}
