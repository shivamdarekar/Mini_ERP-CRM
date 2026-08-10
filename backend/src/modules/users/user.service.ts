import { Prisma, type User } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { createAuditLog } from '../../common/services/audit.service.js';
import { hashPassword } from '../../common/utils/password.js';
import type { RegisterInput } from '../auth/auth.validation.js';
import type { UserListQueryInput, UserUpdateInput } from './user.validation.js';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const handleDbError = (error: unknown): never => {
  if (error instanceof ApiError) throw error;

  if (typeof error === 'object' && error !== null) {
    const dbError = error as { code?: string; message?: string };
    if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
      throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
    }
  }

  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const buildUserWhere = (query: UserListQueryInput): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  return where;
};

export const createUserService = async (input: RegisterInput, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: input.email } });
      if (existing) throw new ApiError(409, 'An account with this email already exists.');

      const passwordHash = await hashPassword(input.password);
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
        },
        select: userSelect,
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        description: 'User created',
      });

      return user;
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const getUsersService = async (query: UserListQueryInput) => {
  const skip = (query.page - 1) * query.limit;

  try {
    const where = buildUserWhere(query);
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),
    ]);

    return {
      data: users,
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

export const getUserByIdService = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) throw new ApiError(404, 'User not found');
    return user;
  } catch (error) {
    handleDbError(error);
  }
};

export const updateUserService = async (userId: string, input: UserUpdateInput, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true },
      });

      if (!existing) throw new ApiError(404, 'User not found');

      const data: Prisma.UserUpdateInput = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      };

      const user = await tx.user.update({
        where: { id: userId },
        data,
        select: userSelect,
      });

      const description = input.isActive !== undefined && input.isActive !== existing.isActive
        ? input.isActive
          ? 'User activated'
          : 'User deactivated'
        : 'User updated';

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: user.id,
        description,
      });

      return user;
    });
  } catch (error) {
    handleDbError(error);
  }
};
