import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import { registerSchema } from '../auth/auth.validation.js';
import { userIdParamsSchema, userListQuerySchema, userUpdateSchema } from './user.validation.js';
import { createUserService, getUserByIdService, getUsersService, updateUserService } from './user.service.js';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const user = await createUserService(parsed.data, req.user!.userId);

  res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = userListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getUsersService(parsed.data);

  res.status(200).json(new ApiResponse(200, result, 'Users fetched successfully'));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const parsed = userIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const user = await getUserByIdService(parsed.data.id);

  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const idParsed = userIdParamsSchema.safeParse(req.params);
  if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

  const bodyParsed = userUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', bodyParsed.error.issues);

  const user = await updateUserService(idParsed.data.id, bodyParsed.data, req.user!.userId);

  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});
