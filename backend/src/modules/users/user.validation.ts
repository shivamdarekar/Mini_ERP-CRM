import { z } from 'zod';
import { Role } from '@prisma/client';

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
