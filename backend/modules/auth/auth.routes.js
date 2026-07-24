import express from 'express';
import { login, getMe, updateMe, changePassword } from './auth.controller.js';
import { protect } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);

export default router;
