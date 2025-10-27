import { ObjectId } from 'mongodb';
import { badRequest } from '../lib/errors.js';

export function toObjectId(value, field = 'id') {
  if (value instanceof ObjectId) {
    return value;
  }
  if (!ObjectId.isValid(value)) {
    throw badRequest(`Invalid ${field}`);
  }
  return new ObjectId(value);
}
