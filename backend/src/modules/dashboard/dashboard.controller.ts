import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import { getDashboardService } from './dashboard.service.js';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const result = await getDashboardService(req.user!.role, req.user!.userId);

  res.status(200).json(new ApiResponse(200, result));
});
