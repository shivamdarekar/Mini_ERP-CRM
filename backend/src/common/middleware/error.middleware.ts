import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

export { asyncHandler } from '../utils/asyncHandler.js';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: (err as ApiError).errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
