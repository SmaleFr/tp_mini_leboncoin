import { getCollection } from '../config/mongo.js';
import { notFound } from '../lib/errors.js';
import { toObjectId } from '../utils/objectId.js';
import { getAdById } from './adService.js';

const usersCollection = () => getCollection('users');
const adsCollection = () => getCollection('ads');

export async function addFavorite(userId, adId) {
  const userObjectId = toObjectId(userId);
  const adObjectId = toObjectId(adId);
  await getAdById(adObjectId);

  const result = await usersCollection().updateOne(
    { _id: userObjectId },
    { $addToSet: { favorites: adObjectId }, $set: { updatedAt: new Date() } },
  );

  if ((result?.matchedCount ?? 0) === 0) {
    throw notFound('User not found');
  }

  return listFavorites(userId);
}

export async function removeFavorite(userId, adId) {
  const userObjectId = toObjectId(userId);
  const adObjectId = toObjectId(adId);
  const result = await usersCollection().updateOne(
    { _id: userObjectId },
    { $pull: { favorites: adObjectId }, $set: { updatedAt: new Date() } },
  );
  if ((result?.matchedCount ?? 0) === 0) {
    throw notFound('User not found');
  }
  return listFavorites(userId);
}

export async function listFavorites(userId) {
  const user = await usersCollection().findOne({ _id: toObjectId(userId) });
  if (!user) {
    throw notFound('User not found');
  }
  const favoriteIds = user.favorites ?? [];
  if (favoriteIds.length === 0) {
    return [];
  }
  const ads = await adsCollection()
    .find({ _id: { $in: favoriteIds } })
    .sort({ createdAt: -1 })
    .toArray();
  return ads;
}
