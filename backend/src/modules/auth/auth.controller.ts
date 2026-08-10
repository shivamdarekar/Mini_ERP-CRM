import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import { env } from '../../config/env.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.validation.js';
import {
  changePasswordService,
  forgotPasswordService,
  getMeService,
  loginService,
  resetPasswordService,
  updateProfileService,
} from './auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
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

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const user = await updateProfileService(req.user!.userId, parsed.data);

  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await changePasswordService(req.user!.userId, parsed.data);

  res.status(200).json(new ApiResponse(200, result, 'Password updated successfully'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await forgotPasswordService(parsed.data);

  res.status(200).json(new ApiResponse(200, result, 'Password reset request processed'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await resetPasswordService(parsed.data);

  res.status(200).json(new ApiResponse(200, result, 'Password reset successfully'));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.userId);

  res.status(200).json(new ApiResponse(200, user));
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
