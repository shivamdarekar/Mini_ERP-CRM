import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { createAuditLog } from '../../common/services/audit.service.js';
import type {
	CustomerCreateInput,
	CustomerListQueryInput,
	CustomerUpdateInput,
	FollowUpCreateInput,
} from './customer.validation.js';

const customerSelect = {
	id: true,
	name: true,
	mobile: true,
	email: true,
	businessName: true,
	gstNumber: true,
	customerType: true,
	address: true,
	status: true,
	followUpDate: true,
	notes: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.CustomerSelect;

const followUpSelect = {
	id: true,
	content: true,
	createdAt: true,
	createdBy: true,
	createdByUser: {
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	},
} satisfies Prisma.FollowUpNoteSelect;

const customerDetailSelect = {
	...customerSelect,
	followUpNotes: {
		orderBy: { createdAt: 'desc' as const },
		select: followUpSelect,
	},
} satisfies Prisma.CustomerSelect;

const handleDbError = (error: unknown): never => {
	if (error instanceof ApiError) throw error;

	if (typeof error === 'object' && error !== null) {
		const dbError = error as { code?: string; message?: string };

		if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
			throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
		}

		if (dbError.code === 'P2002') {
			throw new ApiError(409, 'Customer already exists with the same unique field.');
		}
	}

	throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const buildCustomerWhere = (query: CustomerListQueryInput): Prisma.CustomerWhereInput => {
	const where: Prisma.CustomerWhereInput = {};
	const search = query.search?.trim();

	if (search) {
		where.OR = [
			{ name: { contains: search, mode: 'insensitive' } },
			{ businessName: { contains: search, mode: 'insensitive' } },
			{ mobile: { contains: search, mode: 'insensitive' } },
			{ email: { contains: search, mode: 'insensitive' } },
		];
	}

	if (query.status) where.status = query.status;
	if (query.customerType) where.customerType = query.customerType;

	return where;
};

export const createCustomerService = async (input: CustomerCreateInput, actorUserId: string) => {
	try {
		return await prisma.$transaction(async (tx) => {
			const createData: Prisma.CustomerUncheckedCreateInput = {
				name: input.name,
				mobile: input.mobile,
				email: input.email,
				businessName: input.businessName,
				customerType: input.customerType,
				address: input.address,
				status: input.status,
				notes: input.notes ?? '',
				...(input.gstNumber !== undefined ? { gstNumber: input.gstNumber } : {}),
				...(input.followUpDate !== undefined ? { followUpDate: input.followUpDate } : {}),
			};

			const customer = await tx.customer.create({
				data: createData,
				select: customerSelect,
			});

			await createAuditLog(tx, {
				userId: actorUserId,
				action: 'CREATE',
				entityType: 'CUSTOMER',
				entityId: customer.id,
				description: 'Customer created',
			});

			return customer;
		});
	} catch (error) {
		handleDbError(error);
	}
};

export const getCustomersService = async (query: CustomerListQueryInput) => {
	const where = buildCustomerWhere(query);
	const skip = (query.page - 1) * query.limit;

	try {
		const [total, data] = await prisma.$transaction([
			prisma.customer.count({ where }),
			prisma.customer.findMany({
				where,
				skip,
				take: query.limit,
				orderBy: { createdAt: 'desc' },
				select: customerSelect,
			}),
		]);

		return {
			data,
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: Math.ceil(total / query.limit),
			},
		};
	} catch (error) {
		handleDbError(error);
	}
};

export const getCustomerByIdService = async (customerId: string) => {
	try {
		const customer = await prisma.customer.findUnique({
			where: { id: customerId },
			select: customerDetailSelect,
		});

		if (!customer) throw new ApiError(404, 'Customer not found');

		return customer;
	} catch (error) {
		handleDbError(error);
	}
};

export const updateCustomerService = async (
	customerId: string,
	input: CustomerUpdateInput,
	actorUserId: string
) => {
	try {
		return await prisma.$transaction(async (tx) => {
			const existing = await tx.customer.findUnique({
				where: { id: customerId },
				select: { id: true },
			});

			if (!existing) throw new ApiError(404, 'Customer not found');

			const customer = await tx.customer.update({
				where: { id: customerId },
				data: {
					...(input.name !== undefined ? { name: input.name } : {}),
					...(input.mobile !== undefined ? { mobile: input.mobile } : {}),
					...(input.email !== undefined ? { email: input.email } : {}),
					...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
					...(input.gstNumber !== undefined ? { gstNumber: input.gstNumber } : {}),
					...(input.customerType !== undefined ? { customerType: input.customerType } : {}),
					...(input.address !== undefined ? { address: input.address } : {}),
					...(input.status !== undefined ? { status: input.status } : {}),
					...(input.followUpDate !== undefined ? { followUpDate: input.followUpDate } : {}),
					...(input.notes !== undefined ? { notes: input.notes } : {}),
				},
				select: customerSelect,
			});

			await createAuditLog(tx, {
				userId: actorUserId,
				action: 'UPDATE',
				entityType: 'CUSTOMER',
				entityId: customer.id,
				description: 'Customer updated',
			});

			return customer;
		});
	} catch (error) {
		handleDbError(error);
	}
};

export const addFollowUpService = async (
	customerId: string,
	input: FollowUpCreateInput,
	actorUserId: string
) => {
	try {
		return await prisma.$transaction(async (tx) => {
			const customer = await tx.customer.findUnique({
				where: { id: customerId },
				select: { id: true },
			});

			if (!customer) throw new ApiError(404, 'Customer not found');

			const note = await tx.followUpNote.create({
				data: {
					customerId,
					content: input.content,
					createdBy: actorUserId,
				},
				select: followUpSelect,
			});

			await createAuditLog(tx, {
				userId: actorUserId,
				action: 'CREATE',
				entityType: 'FOLLOW_UP_NOTE',
				entityId: note.id,
				description: 'Customer follow-up note added',
				metadata: {
					customerId,
				},
			});

			return note;
		});
	} catch (error) {
		handleDbError(error);
	}
};

export const getFollowUpsService = async (customerId: string) => {
	try {
		const customer = await prisma.customer.findUnique({
			where: { id: customerId },
			select: {
				id: true,
				followUpNotes: {
					orderBy: { createdAt: 'desc' },
					select: followUpSelect,
				},
			},
		});

		if (!customer) throw new ApiError(404, 'Customer not found');

		return customer.followUpNotes;
	} catch (error) {
		handleDbError(error);
	}
};
