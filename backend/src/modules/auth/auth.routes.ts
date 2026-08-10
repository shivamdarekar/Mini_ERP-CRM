import { Router } from 'express';
import { changePassword, forgotPassword, getMe, login, logout, resetPassword, updateMe } from './auth.controller.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', verifyJWT, getMe);
router.patch('/me', verifyJWT, updateMe);
router.patch('/password', verifyJWT, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyJWT, logout);

export default router;
