import express from 'express';
import { getRoles, updateRolePermissions } from './role.controller.js';
import { protect } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/rbac.js';
import { auditLogger } from '../../middlewares/auditLogger.js';

const router = express.Router();

router.use(protect);
router.use(authorize('manage_roles'));

router.get('/', getRoles);
router.put('/:id/permissions', auditLogger('Update Role Permissions'), updateRolePermissions);

export default router;
