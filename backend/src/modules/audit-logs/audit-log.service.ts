import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import type { AuditLogListQueryInput } from './audit-log.validation.js';

type AuditLogRow = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const auditLogSelect = {
  id: true,
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  description: true,
  metadata: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

const handleDbError = (error: unknown): never => {
  if (typeof error === 'object' && error !== null) {
    const dbError = error as { code?: string; message?: string };
    if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
      throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
    }
  }

  if (error instanceof ApiError) throw error;
  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const buildAuditLogWhere = (query: AuditLogListQueryInput): Prisma.AuditLogWhereInput => {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = query.from;
    if (query.to) where.createdAt.lte = query.to;
  }

  return where;
};

export const getAuditLogsService = async (query: AuditLogListQueryInput) => {
  const skip = (query.page - 1) * query.limit;

  try {
    const where = buildAuditLogWhere(query);
    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: auditLogSelect,
      }),
    ]);

    return {
      data: logs as AuditLogRow[],
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  } catch (error) {
    handleDbError(error);
  }
};
