import { z } from 'zod';

export const auditLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid('Invalid user id').optional(),
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditLogListQueryInput = z.infer<typeof auditLogListQuerySchema>;
