import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import {
  cancelChallan,
  confirmChallan,
  createChallan,
  getChallanById,
  getChallans,
  updateDraftChallan,
} from './challan.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS), getChallans);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS), getChallanById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.SALES), createChallan);
router.patch('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SALES), updateDraftChallan);
router.post('/:id/confirm', authorizeRoles(ROLES.ADMIN, ROLES.SALES), confirmChallan);
router.post('/:id/cancel', authorizeRoles(ROLES.ADMIN, ROLES.SALES), cancelChallan);

export default router;