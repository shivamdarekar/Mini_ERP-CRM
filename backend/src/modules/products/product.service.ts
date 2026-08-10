import { Prisma, type Product } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { createAuditLog } from '../../common/services/audit.service.js';
import type {
  ProductCreateInput,
  ProductListQueryInput,
  ProductUpdateInput,
} from './product.validation.js';

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const productSelect = {
  id: true,
  name: true,
  sku: true,
  category: true,
  unitPrice: true,
  currentStock: true,
  minimumStock: true,
  warehouseLocation: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const handleDbError = (error: unknown): never => {
  if (error instanceof ApiError) throw error;

  if (typeof error === 'object' && error !== null) {
    const dbError = error as { code?: string; message?: string };

    if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
      throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
    }

    if (dbError.code === 'P2002') {
      throw new ApiError(409, 'Product with this SKU already exists');
    }
  }

  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const toMoneyString = (value: Product['unitPrice'] | string): string => {
  if (typeof value === 'string') return Number(value).toFixed(2);
  return value.toFixed(2);
};

const serializeProduct = (product: Pick<
  Product,
  | 'id'
  | 'name'
  | 'sku'
  | 'category'
  | 'unitPrice'
  | 'currentStock'
  | 'minimumStock'
  | 'warehouseLocation'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>): Record<string, unknown> => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  category: product.category,
  unitPrice: toMoneyString(product.unitPrice),
  currentStock: product.currentStock,
  minimumStock: product.minimumStock,
  warehouseLocation: product.warehouseLocation,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const serializeProductRow = (product: ProductRow): Record<string, unknown> => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  category: product.category,
  unitPrice: Number(product.unitPrice).toFixed(2),
  currentStock: product.currentStock,
  minimumStock: product.minimumStock,
  warehouseLocation: product.warehouseLocation,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const buildProductWhere = (query: ProductListQueryInput): Prisma.ProductWhereInput => {
  const where: Prisma.ProductWhereInput = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (query.category) where.category = query.category;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  return where;
};

const buildLowStockWhereSql = (query: ProductListQueryInput) => {
  const conditions: Prisma.Sql[] = [];
  const search = query.search?.trim();

  if (search) {
    const like = `%${search}%`;
    conditions.push(
      Prisma.sql`("name" ILIKE ${like} OR "sku" ILIKE ${like} OR "category" ILIKE ${like})`
    );
  }

  if (query.category) conditions.push(Prisma.sql`"category" = ${query.category}`);
  if (query.isActive !== undefined) conditions.push(Prisma.sql`"isActive" = ${query.isActive}`);
  if (query.lowStock) conditions.push(Prisma.sql`"currentStock" <= "minimumStock"`);

  if (conditions.length === 0) return Prisma.sql``;

  let clause = conditions[0];
  for (let index = 1; index < conditions.length; index += 1) {
    clause = Prisma.sql`${clause} AND ${conditions[index]}`;
  }

  return Prisma.sql`WHERE ${clause}`;
};

export const createProductService = async (input: ProductCreateInput, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          sku: input.sku,
          category: input.category,
          unitPrice: new Prisma.Decimal(input.unitPrice),
          currentStock: input.currentStock,
          minimumStock: input.minimumStock,
          warehouseLocation: input.warehouseLocation,
          isActive: input.isActive,
        },
        select: productSelect,
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        description: 'Product created',
      });

      return serializeProduct(product);
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const getProductsService = async (query: ProductListQueryInput) => {
  const skip = (query.page - 1) * query.limit;

  try {
    if (query.lowStock) {
      const whereSql = buildLowStockWhereSql(query);

      const [countResult, rows] = await prisma.$transaction([
        prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "Product"
          ${whereSql}
        `),
        prisma.$queryRaw<ProductRow[]>(Prisma.sql`
          SELECT
            id,
            name,
            sku,
            category,
            "unitPrice"::text AS "unitPrice",
            "currentStock",
            "minimumStock",
            "warehouseLocation",
            "isActive",
            "createdAt",
            "updatedAt"
          FROM "Product"
          ${whereSql}
          ORDER BY "createdAt" DESC
          LIMIT ${query.limit}
          OFFSET ${skip}
        `),
      ]);

      const total = Number(countResult[0]?.count ?? 0n);

      return {
        data: rows.map(serializeProductRow),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    }

    const where = buildProductWhere(query);

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: productSelect,
      }),
    ]);

    return {
      data: products.map(serializeProduct),
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

export const getProductByIdService = async (productId: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: productSelect,
    });

    if (!product) throw new ApiError(404, 'Product not found');

    return serializeProduct(product);
  } catch (error) {
    handleDbError(error);
  }
};

export const updateProductService = async (
  productId: string,
  input: ProductUpdateInput,
  actorUserId: string
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true },
      });

      if (!existing) throw new ApiError(404, 'Product not found');

      const data: Prisma.ProductUpdateInput = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(input.unitPrice) } : {}),
        ...(input.minimumStock !== undefined ? { minimumStock: input.minimumStock } : {}),
        ...(input.warehouseLocation !== undefined ? { warehouseLocation: input.warehouseLocation } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      };

      const product = await tx.product.update({
        where: { id: productId },
        data,
        select: productSelect,
      });

      const lifecycleChanged = input.isActive !== undefined && input.isActive !== existing.isActive;
      const description = lifecycleChanged
        ? input.isActive
          ? 'Product activated'
          : 'Product deactivated'
        : 'Product updated';

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        description,
      });

      return serializeProduct(product);
    });
  } catch (error) {
    handleDbError(error);
  }
};