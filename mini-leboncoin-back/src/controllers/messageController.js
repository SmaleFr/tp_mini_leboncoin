import asyncHandler from '../utils/asyncHandler.js';
import { createMessage, listMessagesForAd } from '../services/messageService.js';

function presentUser(user) {
  if (!user) return null;
  if (user.id) {
    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
    };
  }
  const { _id, ...rest } = user;
  return {
    id: _id?.toString?.() ?? _id,
    name: rest.name ?? null,
    email: rest.email ?? null,
  };
}

function presentMessage(message) {
  const { _id, adId, senderId, receiverId, createdAt, sender, receiver, ...rest } = message;
  return {
    id: _id?.toString?.() ?? _id,
    adId: adId?.toString?.() ?? adId,
    senderId: senderId?.toString?.() ?? senderId,
    receiverId: receiverId?.toString?.() ?? receiverId,
    sender: presentUser(sender),
    receiver: presentUser(receiver),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    ...rest,
  };
}

export const createMessageController = asyncHandler(async (req, res) => {
  const message = await createMessage(req.params.id, req.user._id, req.body ?? {});
  res.status(201).json({ message: presentMessage(message) });
});

export const listMessagesController = asyncHandler(async (req, res) => {
  const result = await listMessagesForAd(req.params.id, req.user._id);
  res.json({
    messages: result.messages.map(presentMessage),
    participants: result.participants.map(presentUser),
  });
});
