import asyncHandler from '../utils/asyncHandler.js';
import { createAd, deleteAd, getAdById, listAds, updateAd } from '../services/adService.js';

function presentImage(image) {
  if (!image) return image;
  return {
    path: image.path,
    url: image.url ?? `/uploads/${image.path}`,
    mime: image.mime,
    size: image.size,
    createdAt: image.createdAt instanceof Date ? image.createdAt.toISOString() : image.createdAt,
  };
}

export function presentAd(ad) {
  if (!ad) return ad;
  const { _id, ownerId, images = [], createdAt, updatedAt, categoryNormalized, cityNormalized, ...rest } = ad;
  return {
    id: _id?.toString?.() ?? _id,
    ownerId: ownerId?.toString?.() ?? ownerId,
    images: images.map(presentImage),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
    ...rest,
  };
}

export const createAdController = asyncHandler(async (req, res) => {
  const ad = await createAd(req.user._id, req.body ?? {});
  res.status(201).json({ ad: presentAd(ad) });
});

export const listAdsController = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    q,
    category,
    city,
    minPrice,
    maxPrice,
  } = req.query;

  const sortParam = typeof req.query.sort === 'string' ? req.query.sort.toLowerCase() : 'date';
  const orderParam = typeof req.query.order === 'string' ? req.query.order.toLowerCase() : 'desc';
  const sort = sortParam === 'price' ? 'price' : 'date';
  const sortOrder = orderParam === 'asc' ? 'asc' : 'desc';

  const result = await listAds({
    page,
    limit,
    filters: { q, category, city, minPrice, maxPrice },
    sortBy: sort,
    sortOrder,
  });

  res.json({
    ads: result.data.map(presentAd),
    pagination: result.pagination,
  });
});

export const getAdController = asyncHandler(async (req, res) => {
  const ad = await getAdById(req.params.id);
  res.json({ ad: presentAd(ad) });
});

export const updateAdController = asyncHandler(async (req, res) => {
  const ad = await updateAd(req.params.id, req.user._id, req.body ?? {});
  res.json({ ad: presentAd(ad) });
});

export const deleteAdController = asyncHandler(async (req, res) => {
  const ad = await deleteAd(req.params.id, req.user._id);
  res.json({ ad: presentAd(ad) });
});
