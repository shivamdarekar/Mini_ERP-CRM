import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import { getAuditLogs } from './audit-log.controller.js';

const router = Router();

router.use(verifyJWT);
router.get('/', authorizeRoles(ROLES.ADMIN), getAuditLogs);

export default router;
