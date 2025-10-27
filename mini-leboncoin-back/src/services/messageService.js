import { getCollection } from '../config/mongo.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { toObjectId } from '../utils/objectId.js';
import { getAdById } from './adService.js';

const messagesCollection = () => getCollection('messages');
const usersCollection = () => getCollection('users');

function presentUserDoc(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    email: doc.email ?? null,
  };
}

export async function createMessage(adId, senderId, payload) {
  const content = typeof payload.content === 'string' ? payload.content.trim() : '';
  if (!content) {
    throw badRequest('Message content is required');
  }
  const ad = await getAdById(adId);
  const senderObjectId = toObjectId(senderId, 'senderId');
  const ownerObjectId = ad.ownerId;

  let receiverObjectId = ownerObjectId;

  if (senderObjectId.toString() === ownerObjectId.toString()) {
    const recipientId = typeof payload.recipientId === 'string' ? payload.recipientId.trim() : '';
    if (!recipientId) {
      throw badRequest('recipientId is required to reply to a message');
    }
    receiverObjectId = toObjectId(recipientId, 'recipientId');
    if (receiverObjectId.toString() === ownerObjectId.toString()) {
      throw badRequest('Cannot send a message to yourself');
    }
    const recipientExists = await usersCollection().findOne(
      { _id: receiverObjectId },
      { projection: { _id: 1 } },
    );
    if (!recipientExists) {
      throw notFound('Recipient not found');
    }
  }

  const message = {
    adId: toObjectId(adId),
    senderId: senderObjectId,
    receiverId: receiverObjectId,
    content,
    createdAt: new Date(),
  };
  const result = await messagesCollection().insertOne(message);

  const [senderDoc, receiverDoc] = await Promise.all([
    usersCollection().findOne({ _id: senderObjectId }, { projection: { name: 1, email: 1 } }),
    usersCollection().findOne({ _id: receiverObjectId }, { projection: { name: 1, email: 1 } }),
  ]);

  return {
    ...message,
    _id: result.insertedId,
    sender: presentUserDoc(senderDoc),
    receiver: presentUserDoc(receiverDoc),
  };
}

export async function listMessagesForAd(adId, requesterId) {
  const ad = await getAdById(adId);
  const requesterObjectId = toObjectId(requesterId, 'requesterId');
  const isOwner = ad.ownerId.toString() === requesterObjectId.toString();

  const query = { adId: toObjectId(adId) };

  if (!isOwner) {
    query.$or = [
      { senderId: requesterObjectId },
      { receiverId: requesterObjectId },
    ];
  }

  const messages = await messagesCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  if (messages.length === 0) {
    if (!isOwner) {
      return { messages: [], participants: [] };
    }
    return { messages: [], participants: [] };
  }

  const ownerIdStr = ad.ownerId.toString();
  const userIds = new Set();
  for (const msg of messages) {
    userIds.add(msg.senderId.toString());
    if (msg.receiverId) {
      userIds.add(msg.receiverId.toString());
    }
  }

  if (isOwner) {
    // ensure owner is present even if only sender ids exist
    userIds.add(ownerIdStr);
  }

  const userDocs = await usersCollection()
    .find({ _id: { $in: [...userIds].map((id) => toObjectId(id)) } })
    .project({ name: 1, email: 1 })
    .toArray();
  const userMap = new Map(userDocs.map((user) => [user._id.toString(), presentUserDoc(user)]));

  let participants = [];
  if (isOwner) {
    participants = [...new Set(
      messages
        .flatMap((msg) => [msg.senderId?.toString(), msg.receiverId?.toString()])
        .filter((id) => id && id !== ownerIdStr),
    )]
      .map((id) => userMap.get(id))
      .filter(Boolean);
  }

  const decoratedMessages = messages.map((msg) => ({
    ...msg,
    sender: userMap.get(msg.senderId.toString()) ?? null,
    receiver: msg.receiverId ? userMap.get(msg.receiverId.toString()) ?? null : null,
  }));

  return {
    messages: decoratedMessages,
    participants,
  };
}
