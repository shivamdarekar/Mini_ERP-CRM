import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import {
  inventoryMovementsQuerySchema,
  inventoryProductIdParamsSchema,
  lowStockQuerySchema,
  stockInSchema,
  stockOutSchema,
} from './inventory.validation.js';
import {
  getInventoryProductDetailService,
  getLowStockProductsService,
  getMovementsService,
  stockInService,
  stockOutService,
} from './inventory.service.js';

export const stockIn = asyncHandler(async (req: Request, res: Response) => {
  const parsed = stockInSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await stockInService(parsed.data, req.user!.userId);

  res.status(200).json(new ApiResponse(200, result, 'Stock added successfully'));
});

export const stockOut = asyncHandler(async (req: Request, res: Response) => {
  const parsed = stockOutSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await stockOutService(parsed.data, req.user!.userId);

  res.status(200).json(new ApiResponse(200, result, 'Stock reduced successfully'));
});

export const getMovements = asyncHandler(async (req: Request, res: Response) => {
  const parsed = inventoryMovementsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getMovementsService(parsed.data);

  res.status(200).json(new ApiResponse(200, result));
});

export const getInventoryProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const parsed = inventoryProductIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getInventoryProductDetailService(parsed.data.productId);

  res.status(200).json(new ApiResponse(200, result));
});

export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const parsed = lowStockQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getLowStockProductsService(parsed.data);

  res.status(200).json(new ApiResponse(200, result));
});
