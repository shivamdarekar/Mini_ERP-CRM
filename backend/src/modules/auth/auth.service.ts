import crypto from 'node:crypto';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { hashPassword, comparePassword } from '../../common/utils/password.js';
import { generateToken } from '../../common/utils/jwt.js';
import { env } from '../../config/env.js';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from './auth.validation.js';

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

const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const loginService = async (
  input: LoginInput
): Promise<{
  token: string;
  user: { id: string; name: string; email: string; role: string };
}> => {
  try {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const token = generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: unknown) {
    return handleDbError(error);
  }
};

export const getMeService = async (userId: string): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new ApiError(404, 'User not found.');

    return user;
  } catch (error: unknown) {
    return handleDbError(error);
  }
};

export const updateProfileService = async (
  userId: string,
  input: UpdateProfileInput
): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!existing) throw new ApiError(404, 'User not found.');

    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: input.email } });
      if (emailExists) throw new ApiError(409, 'An account with this email already exists.');
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error: unknown) {
    return handleDbError(error);
  }
};

export const changePasswordService = async (
  userId: string,
  input: ChangePasswordInput
): Promise<{ message: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) throw new ApiError(404, 'User not found.');

    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Invalid current password');

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password updated successfully' };
  } catch (error: unknown) {
    return handleDbError(error);
  }
};

export const forgotPasswordService = async (
  input: ForgotPasswordInput
): Promise<{ message: string; resetToken?: string; expiresAt?: Date }> => {
  try {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      return { message: 'If the account exists, a password reset link can be generated.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = hashResetToken(resetToken);
    const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    return {
      message: 'Password reset request created successfully',
      ...(env.NODE_ENV !== 'production' ? { resetToken } : {}),
      expiresAt: passwordResetExpiresAt,
    };
  } catch (error: unknown) {
    return handleDbError(error);
  }
};

export const resetPasswordService = async (
  input: ResetPasswordInput
): Promise<{ message: string }> => {
  try {
    const passwordResetToken = hashResetToken(input.token);

    const user = await prisma.user.findFirst({
      where: { passwordResetToken },
      select: { id: true, passwordResetExpiresAt: true },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <= Date.now()
    ) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  } catch (error: unknown) {
    return handleDbError(error);
  }
};
