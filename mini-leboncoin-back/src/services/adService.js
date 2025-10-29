import { getCollection } from '../config/mongo.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { toObjectId } from '../utils/objectId.js';
import { saveBase64Images, deleteImages } from '../utils/imageStorage.js';
import env from '../config/env.js';
import { saveImagesRemote, deleteImagesRemote, mediaEnabled } from './mediaClient.js';

const adsCollection = () => getCollection('ads');
const usersCollection = () => getCollection('users');
const messagesCollection = () => getCollection('messages');

function sanitizeAd(ad) {
  if (!ad) return ad;
  return ad;
}

function normaliseString(value, fieldName) {
  if (typeof value !== 'string') {
    throw badRequest(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw badRequest(`${fieldName} cannot be empty`);
  }
  return trimmed;
}

function ensurePrice(value) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw badRequest('Price must be a positive number');
  }
  return Math.round(num * 100) / 100;
}

export async function createAd(ownerId, payload) {
  const title = normaliseString(payload.title, 'Title');
  const description = normaliseString(payload.description, 'Description');
  const category = normaliseString(payload.category, 'Category');
  const city = normaliseString(payload.city, 'City');
  const price = ensurePrice(payload.price);

  const imageInput = payload.images ?? [];
  const imageList = Array.isArray(imageInput) ? imageInput : [imageInput];
  let images;
  if (mediaEnabled()) {
    try {
      images = await saveImagesRemote(imageList, { subdir: 'ads' });
    } catch (e) {
      // fallback local if remote fails
      images = await saveBase64Images(imageList, { subdir: 'ads' });
    }
  } else {
    images = await saveBase64Images(imageList, { subdir: 'ads' });
  }
  const now = new Date();

  const doc = {
    ownerId: toObjectId(ownerId, 'ownerId'),
    title,
    description,
    price,
    category,
    city,
    categoryNormalized: category.toLowerCase(),
    cityNormalized: city.toLowerCase(),
    images: images.map((image) => ({ ...image, createdAt: now })),
    createdAt: now,
    updatedAt: now,
  };

  const result = await adsCollection().insertOne(doc);
  return sanitizeAd({ ...doc, _id: result.insertedId });
}

export async function listAds({
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'date',
  sortOrder = 'desc',
}) {
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const query = {};

  if (filters.q) {
    query.$text = { $search: filters.q.trim() };
  }
  if (filters.category) {
    query.categoryNormalized = filters.category.trim().toLowerCase();
  }
  if (filters.city) {
    query.cityNormalized = filters.city.trim().toLowerCase();
  }

  const minPriceValue = filters.minPrice !== undefined ? Number.parseFloat(filters.minPrice) : undefined;
  const maxPriceValue = filters.maxPrice !== undefined ? Number.parseFloat(filters.maxPrice) : undefined;
  if (Number.isFinite(minPriceValue) || Number.isFinite(maxPriceValue)) {
    query.price = {};
    if (Number.isFinite(minPriceValue)) {
      query.price.$gte = minPriceValue;
    }
    if (Number.isFinite(maxPriceValue)) {
      query.price.$lte = maxPriceValue;
    }
  }

  const sort = {};
  const order = sortOrder === 'asc' ? 1 : -1;
  if (sortBy === 'price') {
    sort.price = order;
  } else {
    sort.createdAt = order;
  }

  const cursor = adsCollection().find(query).sort(sort).skip(skip).limit(pageSize);
  const [items, total] = await Promise.all([
    cursor.toArray(),
    adsCollection().countDocuments(query),
  ]);

  return {
    data: items.map(sanitizeAd),
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
  };
}

export async function getAdById(id) {
  const ad = await adsCollection().findOne({ _id: toObjectId(id) });
  if (!ad) {
    throw notFound('Ad not found');
  }
  return sanitizeAd(ad);
}

export async function updateAd(adId, ownerId, updates) {
  const ad = await adsCollection().findOne({ _id: toObjectId(adId) });
  if (!ad) {
    throw notFound('Ad not found');
  }
  if (ad.ownerId.toString() !== ownerId.toString()) {
    throw forbidden('You are not allowed to update this ad');
  }

  const now = new Date();
  const $set = { updatedAt: now };

  if (updates.title) {
    $set.title = normaliseString(updates.title, 'Title');
  }
  if (updates.description) {
    $set.description = normaliseString(updates.description, 'Description');
  }
  if (updates.category) {
    const normalised = normaliseString(updates.category, 'Category');
    $set.category = normalised;
    $set.categoryNormalized = normalised.toLowerCase();
  }
  if (updates.city) {
    const normalised = normaliseString(updates.city, 'City');
    $set.city = normalised;
    $set.cityNormalized = normalised.toLowerCase();
  }
  if (updates.price !== undefined) {
    $set.price = ensurePrice(updates.price);
  }

  if (updates.images !== undefined) {
    const updateImages = Array.isArray(updates.images) ? updates.images : [updates.images];
    if (mediaEnabled()) {
      try {
        await deleteImagesRemote(ad.images?.map((img) => img.path ?? img));
      } catch (e) {
        // ignore
      }
    } else {
      await deleteImages(ad.images?.map((img) => img.path));
    }
    const images = mediaEnabled()
      ? await (async () => {
          try { return await saveImagesRemote(updateImages, { subdir: 'ads' }); } catch { return await saveBase64Images(updateImages, { subdir: 'ads' }); }
        })()
      : await saveBase64Images(updateImages, { subdir: 'ads' });
    $set.images = images.map((image) => ({ ...image, createdAt: now }));
  }

  const result = await adsCollection().findOneAndUpdate(
    { _id: ad._id },
    { $set },
    { returnDocument: 'after' },
  );

  const { value } = result ?? {};
  if (!value) {
    throw notFound('Ad not found');
  }

  return sanitizeAd(value);
}

export async function deleteAd(adId, ownerId) {
  const ad = await adsCollection().findOne({ _id: toObjectId(adId) });
  if (!ad) {
    throw notFound('Ad not found');
  }
  if (ownerId && ad.ownerId.toString() !== ownerId.toString()) {
    throw forbidden('You are not allowed to delete this ad');
  }

  await adsCollection().deleteOne({ _id: ad._id });
  if (mediaEnabled()) {
    try { await deleteImagesRemote(ad.images?.map((img) => img.path ?? img)); } catch {}
  } else {
    await deleteImages(ad.images?.map((img) => img.path));
  }
  await usersCollection().updateMany({}, { $pull: { favorites: ad._id } });
  await messagesCollection().deleteMany({ adId: ad._id });

  return sanitizeAd(ad);
}
