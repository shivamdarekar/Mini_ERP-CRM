import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { createAuditLog } from '../../common/services/audit.service.js';
import type {
  InventoryMovementsQueryInput,
  LowStockQueryInput,
  StockInInput,
  StockOutInput,
} from './inventory.validation.js';

type MovementRow = {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type LowStockRow = {
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

const movementSelect = {
  id: true,
  productId: true,
  quantity: true,
  type: true,
  reason: true,
  createdBy: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.StockMovementSelect;

const handleDbError = (error: unknown): never => {
  if (error instanceof ApiError) throw error;

  if (typeof error === 'object' && error !== null) {
    const dbError = error as { code?: string; message?: string };

    if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
      throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
    }

    if (dbError.code === 'P2002') {
      throw new ApiError(409, 'A record with the same unique value already exists');
    }
  }

  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const serializeProduct = (product: {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: Prisma.Decimal | string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  category: product.category,
  unitPrice: typeof product.unitPrice === 'string' ? Number(product.unitPrice).toFixed(2) : product.unitPrice.toFixed(2),
  currentStock: product.currentStock,
  minimumStock: product.minimumStock,
  warehouseLocation: product.warehouseLocation,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const serializeMovement = (movement: MovementRow) => ({
  id: movement.id,
  productId: movement.productId,
  quantity: movement.quantity,
  type: movement.type,
  reason: movement.reason,
  createdBy: movement.createdBy,
  createdAt: movement.createdAt,
  product: movement.product,
  createdByUser: movement.createdByUser,
});

const buildMovementWhere = (query: InventoryMovementsQueryInput): Prisma.StockMovementWhereInput => {
  const where: Prisma.StockMovementWhereInput = {};

  if (query.productId) where.productId = query.productId;
  if (query.type) where.type = query.type;
  if (query.createdBy) where.createdBy = query.createdBy;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = query.from;
    if (query.to) where.createdAt.lte = query.to;
  }

  return where;
};

const buildLowStockWhereSql = () => Prisma.sql`WHERE "isActive" = true AND "currentStock" <= "minimumStock"`;

const ensureProductExistsAndActive = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.isActive) throw new ApiError(409, 'Inactive product cannot be used for stock operations');

  return product;
};

export const stockInService = async (input: StockInInput, actorUserId: string) => {
  try {
    await ensureProductExistsAndActive(input.productId);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: input.productId },
        data: { currentStock: { increment: input.quantity } },
        select: productSelect,
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          type: 'IN',
          reason: input.reason,
          createdBy: actorUserId,
        },
        select: movementSelect,
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'STOCK_IN',
        entityType: 'PRODUCT',
        entityId: input.productId,
        description: `Stock increased by ${input.quantity}`,
        metadata: {
          quantity: input.quantity,
          reason: input.reason,
          movementId: movement.id,
        },
      });

      return {
        product: serializeProduct(updated),
        movement: serializeMovement(movement as MovementRow),
      };
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const stockOutService = async (input: StockOutInput, actorUserId: string) => {
  try {
    await ensureProductExistsAndActive(input.productId);

    return await prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: {
          id: input.productId,
          isActive: true,
          currentStock: {
            gte: input.quantity,
          },
        },
        data: {
          currentStock: {
            decrement: input.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new ApiError(409, 'Insufficient stock');
      }

      const updated = await tx.product.findUnique({
        where: { id: input.productId },
        select: productSelect,
      });

      if (!updated) throw new ApiError(404, 'Product not found');

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          type: 'OUT',
          reason: input.reason,
          createdBy: actorUserId,
        },
        select: movementSelect,
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'STOCK_OUT',
        entityType: 'PRODUCT',
        entityId: input.productId,
        description: `Stock reduced by ${input.quantity}`,
        metadata: {
          quantity: input.quantity,
          reason: input.reason,
          movementId: movement.id,
        },
      });

      return {
        product: serializeProduct(updated),
        movement: serializeMovement(movement as MovementRow),
      };
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const getMovementsService = async (query: InventoryMovementsQueryInput) => {
  const where = buildMovementWhere(query);
  const skip = (query.page - 1) * query.limit;

  try {
    const [total, data] = await prisma.$transaction([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: movementSelect,
      }),
    ]);

    return {
      data: data.map((movement) => serializeMovement(movement as MovementRow)),
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

export const getInventoryProductDetailService = async (productId: string) => {
  try {
    const [product, recentMovements] = await prisma.$transaction([
      prisma.product.findUnique({
        where: { id: productId },
        select: productSelect,
      }),
      prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: movementSelect,
      }),
    ]);

    if (!product) throw new ApiError(404, 'Product not found');

    return {
      product: serializeProduct(product),
      isLowStock: product.currentStock <= product.minimumStock,
      recentMovements: recentMovements.map((movement) => serializeMovement(movement as MovementRow)),
    };
  } catch (error) {
    handleDbError(error);
  }
};

export const getLowStockProductsService = async (query: LowStockQueryInput) => {
  const skip = (query.page - 1) * query.limit;
  const whereSql = buildLowStockWhereSql();

  try {
    const [countRows, rows] = await prisma.$transaction([
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "Product"
        ${whereSql}
      `),
      prisma.$queryRaw<LowStockRow[]>(Prisma.sql`
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

    const total = Number(countRows[0]?.count ?? 0n);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category,
        unitPrice: Number(row.unitPrice).toFixed(2),
        currentStock: row.currentStock,
        minimumStock: row.minimumStock,
        warehouseLocation: row.warehouseLocation,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
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

export const reduceStockAtomically = async (
  tx: Prisma.TransactionClient,
  input: { productId: string; quantity: number }
) => {
  const result = await tx.product.updateMany({
    where: {
      id: input.productId,
      isActive: true,
      currentStock: {
        gte: input.quantity,
      },
    },
    data: {
      currentStock: {
        decrement: input.quantity,
      },
    },
  });

  return result.count;
};
