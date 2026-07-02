import express from 'express';
import { getProducts, createProduct, getProductByCode } from './product.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';

const router = express.Router({ mergeParams: true }); // inherit :brand from parent

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('*'), createProduct);

router.route('/:skuCode')
  .get(protect, getProductByCode);

export default router;
