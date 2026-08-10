import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';

export const authorizeRoles = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized: Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    next();
  };
