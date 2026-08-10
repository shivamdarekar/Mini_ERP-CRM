import { Router } from 'express';
import { login, register, getMe, logout } from './auth.controller.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', verifyJWT, authorizeRoles('ADMIN'), register);
router.get('/me', verifyJWT, getMe);
router.post('/logout', verifyJWT, logout);

export default router;
