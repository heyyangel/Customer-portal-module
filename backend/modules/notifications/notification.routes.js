import express from 'express';
import { getNotifications, markAllRead } from './notification.controller.js';
import { protect } from '../../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-read', markAllRead);

export default router;
