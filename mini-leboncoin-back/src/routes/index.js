import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adRoutes from './ad.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use(authRoutes);
router.use(userRoutes);
router.use(adRoutes);

export default router;
