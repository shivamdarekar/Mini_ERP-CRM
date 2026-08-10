import { Router } from 'express';
import { login, getMe, logout } from './auth.controller.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', verifyJWT, getMe);
router.post('/logout', verifyJWT, logout);

export default router;
