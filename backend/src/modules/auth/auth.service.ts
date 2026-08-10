import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { hashPassword, comparePassword } from '../../common/utils/password.js';
import { generateToken } from '../../common/utils/jwt.js';
import type { LoginInput, RegisterInput } from './auth.validation.js';

const handleDbError = (error: any): never => {
  if (
    error.code === 'P1001' ||
    error.message?.includes("Can't reach database")
  ) {
    throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
  }
  if (error instanceof ApiError) throw error;
  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

export const loginService = async (input: LoginInput) => {
  let user;

  try {
    user = await prisma.user.findUnique({ where: { email: input.email } });
  } catch (error: any) {
    handleDbError(error);
  }

  // vague message intentionally — don't reveal if email exists
  if (!user) throw new ApiError(401, 'Invalid email or password');
  
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
};

export const registerService = async (input: RegisterInput) => {
  let exists;

  try {
    exists = await prisma.user.findUnique({ where: { email: input.email } });
  } catch (error: any) {
    handleDbError(error);
  }

  if (exists) throw new ApiError(409, 'An account with this email already exists.');

  const passwordHash = await hashPassword(input.password);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error: any) {
    // P2002 = unique constraint violation (race condition on email)
    if (error.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists.');
    }
    handleDbError(error);
  }

  return user;
};

export const getMeService = async (userId: string) => {
  let user;

  try {
    user = await prisma.user.findUnique({
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
  } catch (error: any) {
    handleDbError(error);
  }

  if (!user) throw new ApiError(404, 'User not found.');

  return user;
};
