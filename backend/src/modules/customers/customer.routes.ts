import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import {
	createCustomer,
	createFollowUp,
	getCustomerActivity,
	getCustomerById,
	getCustomers,
	getFollowUps,
	updateCustomer,
} from './customer.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTS), getCustomers);
router.get('/:id/activity', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTS), getCustomerActivity);
router.get('/:id/follow-ups', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTS), getFollowUps);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTS), getCustomerById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.SALES), createCustomer);
router.patch('/:id', authorizeRoles(ROLES.ADMIN, ROLES.SALES), updateCustomer);
router.post('/:id/follow-ups', authorizeRoles(ROLES.ADMIN, ROLES.SALES), createFollowUp);

export default router;
