import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import { loginSchema } from './auth.validation.js';
import { loginService, getMeService } from './auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const { token, user } = await loginService(parsed.data);

  res
    .status(200)
    .cookie('token', token, cookieOptions)
    .json(new ApiResponse(200, { token, user }, 'Login successful'));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.userId);

  res.status(200).json(new ApiResponse(200, user, 'Authenticated user'));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .clearCookie('token', {
      httpOnly: true,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
    })
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});
