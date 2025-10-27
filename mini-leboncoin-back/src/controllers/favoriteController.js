import asyncHandler from '../utils/asyncHandler.js';
import { addFavorite, listFavorites, removeFavorite } from '../services/favoriteService.js';
import { presentAd } from './adController.js';

export const addFavoriteController = asyncHandler(async (req, res) => {
  const favorites = await addFavorite(req.user._id, req.params.id);
  res.status(201).json({ favorites: favorites.map(presentAd) });
});

export const removeFavoriteController = asyncHandler(async (req, res) => {
  const favorites = await removeFavorite(req.user._id, req.params.id);
  res.json({ favorites: favorites.map(presentAd) });
});

export const listFavoritesController = asyncHandler(async (req, res) => {
  const favorites = await listFavorites(req.user._id);
  res.json({ favorites: favorites.map(presentAd) });
});
