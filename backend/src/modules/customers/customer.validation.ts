import { CustomerStatus, CustomerType } from '@prisma/client';
import { z } from 'zod';

const mobileSchema = z
	.string()
	.trim()
	.min(7, 'Mobile number is required')
	.max(20, 'Mobile number is too long');

const nameSchema = z.string().trim().min(2, 'Must be at least 2 characters').max(100);
const businessNameSchema = z.string().trim().min(2, 'Must be at least 2 characters').max(150);
const addressSchema = z.string().trim().min(5, 'Address is required').max(255);
const notesSchema = z.string().trim().max(1000, 'Notes are too long');

export const customerIdParamsSchema = z.object({
	id: z.string().uuid('Invalid customer id'),
});

export const customerCreateSchema = z.object({
	name: nameSchema,
	mobile: mobileSchema,
	email: z.string().trim().email('Invalid email address').max(255),
	businessName: businessNameSchema,
	gstNumber: z.string().trim().max(20).optional(),
	customerType: z.nativeEnum(CustomerType),
	address: addressSchema,
	status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
	followUpDate: z.coerce.date().optional(),
	notes: notesSchema.optional(),
});

export const customerUpdateSchema = z
	.object({
		name: nameSchema.optional(),
		mobile: mobileSchema.optional(),
		email: z.string().trim().email('Invalid email address').max(255).optional(),
		businessName: businessNameSchema.optional(),
		gstNumber: z.string().trim().max(20).nullable().optional(),
		customerType: z.nativeEnum(CustomerType).optional(),
		address: addressSchema.optional(),
		status: z.nativeEnum(CustomerStatus).optional(),
		followUpDate: z.coerce.date().nullable().optional(),
		notes: notesSchema.optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: 'At least one field is required',
	});

export const customerListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().trim().max(100).optional(),
	status: z.nativeEnum(CustomerStatus).optional(),
	customerType: z.nativeEnum(CustomerType).optional(),
});

export const followUpCreateSchema = z.object({
	content: z.string().trim().min(3, 'Follow-up content is required').max(1000),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerListQueryInput = z.infer<typeof customerListQuerySchema>;
export type FollowUpCreateInput = z.infer<typeof followUpCreateSchema>;
