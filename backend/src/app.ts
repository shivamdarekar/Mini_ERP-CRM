import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import productRoutes from './modules/products/product.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import challanRoutes from './modules/challans/challan.routes.js';
import userRoutes from './modules/users/user.routes.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/challans', challanRoutes);
app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

export default app;
