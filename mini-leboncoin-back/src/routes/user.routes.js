import { Router } from 'express';
import { deleteUser, getMe, updateUser } from '../controllers/userController.js';
import { listFavoritesController } from '../controllers/favoriteController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/me', requireAuth(), getMe);
router.get('/me/favorites', requireAuth(), listFavoritesController);
router.put('/users/:id', requireAuth(), updateUser);
router.delete('/users/:id', requireAuth(), deleteUser);

export default router;
