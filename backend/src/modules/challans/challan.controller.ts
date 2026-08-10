import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import {
  challanCreateSchema,
  challanIdParamsSchema,
  challanListQuerySchema,
  challanUpdateSchema,
} from './challan.validation.js';
import {
  cancelChallanService,
  confirmChallanService,
  createChallanService,
  getChallanByIdService,
  getChallanHistoryService,
  getChallansService,
  updateDraftChallanService,
} from './challan.service.js';

export const createChallan = asyncHandler(async (req: Request, res: Response) => {
  const parsed = challanCreateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const challan = await createChallanService(parsed.data, req.user!.userId);

  res.status(201).json(new ApiResponse(201, challan, 'Challan created successfully'));
});

export const getChallans = asyncHandler(async (req: Request, res: Response) => {
  const parsed = challanListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getChallansService(parsed.data);

  res.status(200).json(new ApiResponse(200, result));
});

export const getChallanById = asyncHandler(async (req: Request, res: Response) => {
  const parsed = challanIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const challan = await getChallanByIdService(parsed.data.id);

  res.status(200).json(new ApiResponse(200, challan));
});

export const updateDraftChallan = asyncHandler(async (req: Request, res: Response) => {
  const idParsed = challanIdParamsSchema.safeParse(req.params);
  if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

  const bodyParsed = challanUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', bodyParsed.error.issues);

  const challan = await updateDraftChallanService(idParsed.data.id, bodyParsed.data, req.user!.userId);

  res.status(200).json(new ApiResponse(200, challan, 'Challan updated successfully'));
});

export const confirmChallan = asyncHandler(async (req: Request, res: Response) => {
  const parsed = challanIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await confirmChallanService(parsed.data.id, req.user!.userId);

  res.status(200).json(new ApiResponse(200, result, 'Challan confirmed successfully'));
});

export const cancelChallan = asyncHandler(async (req: Request, res: Response) => {
  const parsed = challanIdParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const challan = await cancelChallanService(parsed.data.id, req.user!.userId);

  res.status(200).json(new ApiResponse(200, challan, 'Challan cancelled successfully'));
});

export const getChallanHistory = asyncHandler(async (req: Request, res: Response) => {
	const parsed = challanIdParamsSchema.safeParse(req.params);
	if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

	const history = await getChallanHistoryService(parsed.data.id);

  res.status(200).json(new ApiResponse(200, history));
});