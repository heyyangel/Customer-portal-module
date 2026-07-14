import express from 'express';
import { login, register, getMe, updateMe, changePassword } from './auth.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// The brute-force limiter guards the credential endpoints only. The /me routes
// below are already gated by `protect`, so they don't need it.
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);

export default router;
