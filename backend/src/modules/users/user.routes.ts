import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from './user.controller.js';

const router = Router();

router.use(verifyJWT);

router.post('/', authorizeRoles(ROLES.ADMIN), createUser);
router.get('/', authorizeRoles(ROLES.ADMIN), getUsers);
router.get('/:id', authorizeRoles(ROLES.ADMIN), getUserById);
router.patch('/:id', authorizeRoles(ROLES.ADMIN), updateUser);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteUser);

export default router;
