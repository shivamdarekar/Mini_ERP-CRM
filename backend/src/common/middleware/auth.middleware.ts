import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../../config/prisma.js';

export const verifyJWT = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.token || req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();

    if (!token) throw new ApiError(401, 'Unauthorized: Token not provided');

    const decoded = verifyToken(token);
    const userId = typeof decoded?.id === 'string' ? decoded.id : null;
    const issuedAt = typeof decoded?.iat === 'number' ? decoded.iat * 1000 : undefined;

    if (!userId) throw new ApiError(401, 'Unauthorized: Invalid token payload');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        passwordChangedAt: true,
      },
    });

    if (!user) throw new ApiError(401, 'Unauthorized: User not found');
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated');
    if (user.passwordChangedAt && issuedAt && issuedAt < user.passwordChangedAt.getTime()) {
      throw new ApiError(401, 'Unauthorized: Session has expired');
    }

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
