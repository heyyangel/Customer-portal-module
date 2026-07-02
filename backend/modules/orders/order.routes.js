import express from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus, assignOrder } from './order.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.route('/')
  .get(protect, getOrders)
  .post(protect, authorize('create_order'), auditLogger('Create Order'), createOrder);

router.get('/:id', protect, getOrderById);

router.put('/:id/status', protect, authorize('approve_orders'), updateOrderStatus);
router.put('/:id/assign', protect, authorize('approve_orders'), assignOrder);

export default router;
