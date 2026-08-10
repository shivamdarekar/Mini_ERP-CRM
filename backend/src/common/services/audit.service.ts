import type { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import prisma from '../../config/prisma.js';

type AuditClient = PrismaClient | Prisma.TransactionClient;

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

const handleAuditError = (error: unknown): never => {
  if (error instanceof ApiError) throw error;
  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

export const createAuditLog = async (
  client: AuditClient = prisma,
  input: CreateAuditLogInput
) => {
  try {
    const data: Parameters<AuditClient['auditLog']['create']>[0]['data'] = {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
    };

    if (input.entityId !== undefined) data.entityId = input.entityId;
    if (input.description !== undefined) data.description = input.description;
    if (input.metadata !== undefined) data.metadata = input.metadata;

    return await client.auditLog.create({
      data,
    });
  } catch (error) {
    handleAuditError(error);
  }
};