import { getCollection } from '../config/mongo.js';
import { badRequest, conflict, notFound, unauthorized } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { toObjectId } from '../utils/objectId.js';

const usersCollection = () => getCollection('users');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

export async function createUser({ email, name, password }) {
  if (!email?.trim()) {
    throw badRequest('Email is required');
  }
  if (!name?.trim()) {
    throw badRequest('Name is required');
  }
  if (!password?.trim()) {
    throw badRequest('Password is required');
  }
  if (password.trim().length < 8) {
    throw badRequest('Password must contain at least 8 characters');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw badRequest('Invalid email address');
  }

  const existing = await usersCollection().findOne({ email: normalizedEmail });
  if (existing) {
    throw conflict('Email already registered');
  }

  const { salt, hash } = hashPassword(password.trim());
  const now = new Date();
  const doc = {
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: hash,
    salt,
    favorites: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await usersCollection().insertOne(doc);
  return sanitizeUser({ ...doc, _id: result.insertedId });
}

export async function authenticateUser({ email, password }) {
  if (!email?.trim() || !password?.trim()) {
    throw badRequest('Email and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await usersCollection().findOne({ email: normalizedEmail });
  if (!user) {
    throw unauthorized('Invalid credentials');
  }

  const valid = verifyPassword(password.trim(), user.salt, user.passwordHash);
  if (!valid) {
    throw unauthorized('Invalid credentials');
  }

  return sanitizeUser(user);
}

export async function getUserById(id) {
  const user = await usersCollection().findOne({ _id: toObjectId(id) });
  if (!user) {
    throw notFound('User not found');
  }
  return sanitizeUser(user);
}

export async function getUserWithSecrets(id) {
  const user = await usersCollection().findOne({ _id: toObjectId(id) });
  if (!user) {
    throw notFound('User not found');
  }
  return user;
}

export async function updateUser(id, updates) {
  const allowed = {};
  if (typeof updates.name === 'string') {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      throw badRequest('Name cannot be empty');
    }
    allowed.name = trimmed;
  }
  if (typeof updates.email === 'string') {
    const trimmed = updates.email.trim();
    if (!trimmed) {
      throw badRequest('Email cannot be empty');
    }
    const normalized = trimmed.toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw badRequest('Invalid email address');
    }
    allowed.email = normalized;
  }
  if (typeof updates.password === 'string') {
    if (updates.password.trim().length < 8) {
      throw badRequest('Password must contain at least 8 characters');
    }
    const { salt, hash } = hashPassword(updates.password.trim());
    allowed.passwordHash = hash;
    allowed.salt = salt;
  }

  if (Object.keys(allowed).length === 0) {
    throw badRequest('No valid fields to update');
  }

  const now = new Date();
  allowed.updatedAt = now;

  if (allowed.email) {
    const exists = await usersCollection().findOne({
      email: allowed.email,
      _id: { $ne: toObjectId(id) },
    });
    if (exists) {
      throw conflict('Email already registered');
    }
  }

  const result = await usersCollection().findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: allowed },
    { returnDocument: 'after' },
  );

  const { value } = result ?? {};

  if (!value) {
    throw notFound('User not found');
  }

  return sanitizeUser(value);
}

export async function deleteUser(id) {
  const result = await usersCollection().findOneAndDelete({ _id: toObjectId(id) });
  const { value } = result ?? {};
  if (!value) {
    throw notFound('User not found');
  }
  return sanitizeUser(value);
}

export function sanitize(user) {
  return sanitizeUser(user);
}
