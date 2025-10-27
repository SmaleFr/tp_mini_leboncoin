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
}
