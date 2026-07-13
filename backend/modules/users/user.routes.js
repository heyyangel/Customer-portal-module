import express from 'express';
import { getUsers, createUser, updateUser, updateUserRole, resetUserPassword } from './user.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.use(protect);
router.use(authorize('manage_users'));

router.get('/', getUsers);
router.post('/', auditLogger('Create User'), createUser);
router.patch('/:id', auditLogger('Update User'), updateUser);
router.put('/:id/roles', auditLogger('Update User Role'), updateUserRole);
router.put('/:id/password', auditLogger('Reset User Password'), resetUserPassword);

export default router;
