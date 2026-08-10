import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import {
  productCreateSchema,
  productIdParamsSchema,
  productListQuerySchema,
  productUpdateSchema,
} from './product.validation.js';
import {
  createProductService,
  getProductByIdService,
  getProductsService,
  updateProductService,
} from './product.service.js';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const product = await createProductService(parsed.data, req.user!.userId);

  res.status(201).json(new ApiResponse(201, product, 'Product created successfully'));
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getProductsService(parsed.data);

  res.status(200).json(new ApiResponse(200, result));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const parsed = productIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const product = await getProductByIdService(parsed.data.id);

  res.status(200).json(new ApiResponse(200, product));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const idParsed = productIdParamsSchema.safeParse(req.params);
  if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

  const bodyParsed = productUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', bodyParsed.error.issues);

  const product = await updateProductService(idParsed.data.id, bodyParsed.data, req.user!.userId);

  res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});