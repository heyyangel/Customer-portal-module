import express from 'express';
import { getUsers, updateUserRole } from './user.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.use(protect);
router.use(authorize('manage_users'));

router.get('/', getUsers);
router.put('/:id/roles', auditLogger('Update User Role'), updateUserRole);

export default router;
