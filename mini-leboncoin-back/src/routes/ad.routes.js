import { Router } from 'express';
import {
  createAdController,
  deleteAdController,
  getAdController,
  listAdsController,
  updateAdController,
} from '../controllers/adController.js';
import {
  addFavoriteController,
  removeFavoriteController,
} from '../controllers/favoriteController.js';
import {
  createMessageController,
  listMessagesController,
} from '../controllers/messageController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/ads', listAdsController);
router.get('/ads/:id', getAdController);
router.post('/ads', requireAuth(), createAdController);
router.put('/ads/:id', requireAuth(), updateAdController);
router.delete('/ads/:id', requireAuth(), deleteAdController);

router.post('/ads/:id/favorite', requireAuth(), addFavoriteController);
router.delete('/ads/:id/favorite', requireAuth(), removeFavoriteController);

router.post('/ads/:id/messages', requireAuth(), createMessageController);
router.get('/ads/:id/messages', requireAuth(), listMessagesController);

export default router;
