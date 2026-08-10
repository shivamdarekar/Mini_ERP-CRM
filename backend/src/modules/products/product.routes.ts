import { Router } from 'express';
import { ROLES } from '../../common/constants/roles.js';
import { verifyJWT } from '../../common/middleware/auth.middleware.js';
import { authorizeRoles } from '../../common/middleware/role.middleware.js';
import { createProduct, getProductById, getProducts, updateProduct } from './product.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES, ROLES.ACCOUNTS), getProducts);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES, ROLES.ACCOUNTS), getProductById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), createProduct);
router.patch('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), updateProduct);

export default router;