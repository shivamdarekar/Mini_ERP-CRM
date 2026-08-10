import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';
const PORT = process.env.PORT || 5000;
const APP_VERSION = '1.0.0';

app.get('/', (_req, res) => {
  res.json({
    status: 'running',
    message: 'ERP-CRM Backend API',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});

const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
};

const startServer = async () => {
  try {
    console.log('🔄 Starting services...');

    const [dbResult] = await Promise.allSettled([connectDatabase()]);

    if (dbResult.status === 'fulfilled') {
      console.log('✅ Database connected (Neon PostgreSQL)');
    } else {
      console.error('❌ Database connection failed:', dbResult.reason);
      process.exit(1);
    }

    const BASE_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

    const server = app.listen(PORT, () => {
      console.log(`
🚀 ERP-CRM Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment : ${process.env.NODE_ENV || 'development'}
🔗 Server      : ${BASE_URL}
❤️  Health      : ${BASE_URL}/
📚 API Base    : ${BASE_URL}/api/v1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await prisma.$disconnect();
        console.log('🗄️  Database disconnected');
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
