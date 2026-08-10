import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../../config/prisma.js';

export const verifyJWT = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.token ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) throw new ApiError(401, 'Unauthorized: Token not provided');

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded['id'] },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user) throw new ApiError(401, 'Unauthorized: User not found');
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    next();
  }
);
