
import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import {
  getInventoryProductDetail,
  getLowStockProducts,
  getMovements,
  stockIn,
  stockOut,
} from './inventory.controller.js';

const router = Router();

router.use(verifyJWT);

router.post('/stock-in', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), stockIn);
router.post('/stock-out', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), stockOut);
router.get('/movements', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES, ROLES.ACCOUNTS), getMovements);
router.get('/products/:productId', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES, ROLES.ACCOUNTS), getInventoryProductDetail);
router.get('/low-stock', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES, ROLES.ACCOUNTS), getLowStockProducts);

export default router;
