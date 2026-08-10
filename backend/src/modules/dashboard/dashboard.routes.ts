import { Router } from 'express';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { getDashboard } from './dashboard.controller.js';

const router = Router();

router.use(verifyJWT);
router.get('/overview', getDashboard);
router.get('/', getDashboard);

export default router;
