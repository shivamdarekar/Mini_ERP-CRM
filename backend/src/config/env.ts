import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  CLIENT_URL: z.string().trim().min(1).optional(),
  CORS_ORIGIN: z.string().trim().min(1).optional(),
  BACKEND_URL: z.string().trim().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${details.join('\n')}`);
}

const parseOrigins = (value?: string) =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

const corsOrigins =
  parseOrigins(parsed.data.CORS_ORIGIN).length > 0
    ? parseOrigins(parsed.data.CORS_ORIGIN)
    : parseOrigins(parsed.data.CLIENT_URL);

if (parsed.data.NODE_ENV === 'production' && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN is required in production');
}

export const env = {
  ...parsed.data,
  corsOrigins:
    corsOrigins.length > 0
      ? corsOrigins
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
};
