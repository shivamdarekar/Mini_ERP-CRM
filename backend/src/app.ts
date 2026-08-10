import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import prisma from './config/prisma.js';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import productRoutes from './modules/products/product.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import challanRoutes from './modules/challans/challan.routes.js';
import userRoutes from './modules/users/user.routes.js';
import auditLogRoutes from './modules/audit-logs/audit-log.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
	cors({
		origin: env.corsOrigins,
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;

		res.status(200).json({
			success: true,
			message: 'ERP API is running',
			data: {
				database: 'connected',
			},
		});
	} catch {
		res.status(503).json({
			success: false,
			message: 'ERP API is running but the database is unavailable',
			data: {
				database: 'unavailable',
			},
		});
	}
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/challans', challanRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;
