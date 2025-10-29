import { Router } from 'express';
import { login, signup } from '../controllers/userController.js';
import proofOfWork from '../middlewares/pow.js';
import rateLimit from '../middlewares/rateLimit.js';
import env from '../config/env.js';
import { refresh, logout } from '../controllers/authController.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: env.authRateLimitWindowMs, max: env.authRateLimitMax });

router.post('/signup', authLimiter, proofOfWork(), signup);
router.post('/login', authLimiter, proofOfWork(), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', authLimiter, logout);

export default router;
