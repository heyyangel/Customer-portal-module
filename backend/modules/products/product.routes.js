import express from 'express';
import { getProducts, getInventory, createProduct, getProductByCode } from './product.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';

// Mounted at /api/v1/products (no :brand) — the all-brands Inventory view.
// Requests carrying a brand segment fall through to the router below.
export const inventoryRouter = express.Router();
inventoryRouter.get('/', protect, getInventory);

const router = express.Router({ mergeParams: true }); // inherit :brand from parent

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('*'), createProduct);

router.route('/:skuCode')
  .get(protect, getProductByCode);

export default router;
