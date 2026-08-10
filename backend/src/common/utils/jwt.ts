import jwt from 'jsonwebtoken';
import { ApiError } from './apiError.js';

const SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string) || '7d';

export const generateToken = (userId: string): string => {
  if (!SECRET) {
    throw new ApiError(500, 'JWT secret is not configured');
  }

  return jwt.sign({ id: userId }, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): jwt.JwtPayload => {
  if (!SECRET) {
    throw new ApiError(500, 'JWT secret is not configured');
  }

  try {
    return jwt.verify(token, SECRET) as jwt.JwtPayload;
  } catch {
    throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }
};
