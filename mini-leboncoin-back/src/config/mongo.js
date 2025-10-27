import { MongoClient } from 'mongodb';
import env from './env.js';

let client;
let db;

export async function connectMongo() {
  if (client && client.topology && client.topology.isConnected()) {
    return db;
  }

  client = new MongoClient(env.mongoUri, {
    ignoreUndefined: true,
  });

  await client.connect();
  db = env.mongoDbName ? client.db(env.mongoDbName) : client.db();
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('MongoDB not initialised. Call connectMongo() first.');
  }
  return db;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export async function disconnectMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}
