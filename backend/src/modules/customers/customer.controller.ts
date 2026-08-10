import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ApiError } from '../../common/utils/apiError.js';
import { ApiResponse } from '../../common/utils/apiResponse.js';
import {
	customerCreateSchema,
	customerIdParamsSchema,
	customerListQuerySchema,
	customerUpdateSchema,
	followUpCreateSchema,
} from './customer.validation.js';
import {
	addFollowUpService,
	createCustomerService,
	getCustomerActivityService,
	getCustomerByIdService,
	getCustomersService,
	getFollowUpsService,
	updateCustomerService,
} from './customer.service.js';

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
	const parsed = customerCreateSchema.safeParse(req.body);
	if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

	const customer = await createCustomerService(parsed.data, req.user!.userId);

	res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
	const parsed = customerListQuerySchema.safeParse(req.query);
	if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

	const result = await getCustomersService(parsed.data);

	res.status(200).json(new ApiResponse(200, result));
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
	const parsed = customerIdParamsSchema.safeParse(req.params);
	if (!parsed.success) throw new ApiError(400, 'Validation failed', parsed.error.issues);

	const customer = await getCustomerByIdService(parsed.data.id);

	res.status(200).json(new ApiResponse(200, customer));
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
	const idParsed = customerIdParamsSchema.safeParse(req.params);
	if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

	const bodyParsed = customerUpdateSchema.safeParse(req.body);
	if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', bodyParsed.error.issues);

	const customer = await updateCustomerService(idParsed.data.id, bodyParsed.data, req.user!.userId);

	res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

export const createFollowUp = asyncHandler(async (req: Request, res: Response) => {
	const idParsed = customerIdParamsSchema.safeParse(req.params);
	if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

	const bodyParsed = followUpCreateSchema.safeParse(req.body);
	if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', bodyParsed.error.issues);

	const note = await addFollowUpService(idParsed.data.id, bodyParsed.data, req.user!.userId);

	res.status(201).json(new ApiResponse(201, note, 'Follow-up note added successfully'));
});

export const getFollowUps = asyncHandler(async (req: Request, res: Response) => {
	const idParsed = customerIdParamsSchema.safeParse(req.params);
	if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

	const followUps = await getFollowUpsService(idParsed.data.id);

	res.status(200).json(new ApiResponse(200, followUps));
});

export const getCustomerActivity = asyncHandler(async (req: Request, res: Response) => {
	const idParsed = customerIdParamsSchema.safeParse(req.params);
	if (!idParsed.success) throw new ApiError(400, 'Validation failed', idParsed.error.issues);

	const activity = await getCustomerActivityService(idParsed.data.id);

	res.status(200).json(new ApiResponse(200, activity));
});
