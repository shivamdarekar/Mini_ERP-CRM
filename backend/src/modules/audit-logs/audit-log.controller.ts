import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import { auditLogListQuerySchema } from './audit-log.validation.js';
import { getAuditLogsService } from './audit-log.service.js';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const parsed = auditLogListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

  const result = await getAuditLogsService(parsed.data);

  res.status(200).json(new ApiResponse(200, result));
});
