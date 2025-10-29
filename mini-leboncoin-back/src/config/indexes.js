import { getCollection } from './mongo.js';

export async function ensureIndexes() {
  const users = getCollection('users');
  await users.createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' });

  const ads = getCollection('ads');
  await ads.createIndex({ title: 'text', description: 'text' }, { name: 'ads_text_search' });
  await ads.createIndex({ ownerId: 1 }, { name: 'ads_owner_idx' });
  await ads.createIndex({ categoryNormalized: 1 }, { name: 'ads_category_idx' });
  await ads.createIndex({ cityNormalized: 1 }, { name: 'ads_city_idx' });
  await ads.createIndex({ price: 1, createdAt: -1 }, { name: 'ads_price_date_idx' });

  const messages = getCollection('messages');
  await messages.createIndex({ adId: 1 }, { name: 'messages_ad_idx' });
  await messages.createIndex({ receiverId: 1 }, { name: 'messages_receiver_idx' });
  await messages.createIndex({ senderId: 1 }, { name: 'messages_sender_idx' });

  // Refresh tokens indexes
  const refreshTokens = getCollection('refreshTokens');
  await refreshTokens.createIndex({ tokenHash: 1 }, { unique: true, name: 'refresh_token_hash_unique' });
  await refreshTokens.createIndex({ userId: 1 }, { name: 'refresh_token_user_idx' });
  // TTL: documents will be removed automatically at expiration
  await refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'refresh_token_expire_ttl' });

  // Access tokens indexes
  const accessTokens = getCollection('accessTokens');
  await accessTokens.createIndex({ tokenHash: 1 }, { unique: true, name: 'access_token_hash_unique' });
  await accessTokens.createIndex({ userId: 1 }, { name: 'access_token_user_idx' });
  await accessTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'access_token_expire_ttl' });
}
