import asyncHandler from '../utils/asyncHandler.js';
import {
  authenticateUser,
  createUser,
  deleteUser as deleteUserService,
  getUserById,
  updateUser as updateUserService,
} from '../services/userService.js';
import { createToken } from '../utils/token.js';
import { forbidden } from '../lib/errors.js';

function presentUser(user) {
  if (!user) return user;
  const { _id, favorites = [], createdAt, updatedAt, ...rest } = user;
  return {
    id: _id?.toString?.() ?? _id,
    favorites: favorites.map((fav) => fav?.toString?.() ?? fav),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
    ...rest,
  };
}

export const signup = asyncHandler(async (req, res) => {
  const user = await createUser(req.body ?? {});
  const token = createToken({ sub: user._id.toString() });
  res.status(201).json({ user: presentUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body ?? {});
  const token = createToken({ sub: user._id.toString() });
  res.json({ user: presentUser(user), token });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id);
  res.json({ user: presentUser(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() !== id) {
    throw forbidden('You can only update your own profile');
  }
  const user = await updateUserService(id, req.body ?? {});
  res.json({ user: presentUser(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() !== id) {
    throw forbidden('You can only delete your own account');
  }
  const user = await deleteUserService(id);
  res.json({ user: presentUser(user) });
});
