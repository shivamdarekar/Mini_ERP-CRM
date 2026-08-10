import { ChallanStatus, Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';
import { createAuditLog } from '../../common/services/audit.service.js';
import { reduceStockAtomically } from '../inventory/inventory.service.js';
import type {
  ChallanCreateInput,
  ChallanListQueryInput,
  ChallanUpdateInput,
} from './challan.validation.js';

type ChallanItemInput = ChallanCreateInput['items'][number];

type ChallanItemRow = {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: Prisma.Decimal | string;
  quantity: number;
  total: Prisma.Decimal | string;
};

const challanSelect = {
  id: true,
  challanNumber: true,
  customerId: true,
  totalQuantity: true,
  totalAmount: true,
  status: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      businessName: true,
      customerType: true,
      status: true,
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
  items: {
    select: {
      id: true,
      challanId: true,
      productId: true,
      productName: true,
      sku: true,
      unitPrice: true,
      quantity: true,
      total: true,
    },
  },
} satisfies Prisma.ChallanSelect;

const challanDetailSelect = challanSelect;

const challanListSelect = {
  id: true,
  challanNumber: true,
  customerId: true,
  totalQuantity: true,
  totalAmount: true,
  status: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      businessName: true,
      mobile: true,
      email: true,
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
} satisfies Prisma.ChallanSelect;

const challanItemSelect = {
  id: true,
  challanId: true,
  productId: true,
  productName: true,
  sku: true,
  unitPrice: true,
  quantity: true,
  total: true,
} satisfies Prisma.ChallanItemSelect;

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

const serializeDecimal = (value: Prisma.Decimal | string) =>
  typeof value === 'string' ? Number(value).toFixed(2) : value.toFixed(2);

const serializeChallanItem = (item: ChallanItemRow) => ({
  id: item.id,
  challanId: item.challanId,
  productId: item.productId,
  productName: item.productName,
  sku: item.sku,
  unitPrice: serializeDecimal(item.unitPrice),
  quantity: item.quantity,
  total: serializeDecimal(item.total),
});

const serializeChallan = (challan: {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: Prisma.Decimal | string;
  status: ChallanStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: unknown;
  createdByUser?: unknown;
  items: ChallanItemRow[];
}) => ({
  id: challan.id,
  challanNumber: challan.challanNumber,
  customerId: challan.customerId,
  totalQuantity: challan.totalQuantity,
  totalAmount: serializeDecimal(challan.totalAmount),
  status: challan.status,
  createdBy: challan.createdBy,
  createdAt: challan.createdAt,
  updatedAt: challan.updatedAt,
  customer: challan.customer,
  createdByUser: challan.createdByUser,
  items: challan.items.map(serializeChallanItem),
});

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
  unitPrice: serializeDecimal(product.unitPrice),
  currentStock: product.currentStock,
  minimumStock: product.minimumStock,
  warehouseLocation: product.warehouseLocation,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const serializeMovement = (movement: {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: Date;
  product: { id: string; name: string; sku: string };
  createdByUser: { id: string; name: string; email: string; role: string };
}) => ({
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

const buildChallanWhere = (query: ChallanListQueryInput): Prisma.ChallanWhereInput => {
  const where: Prisma.ChallanWhereInput = {};

  if (query.search) where.challanNumber = { contains: query.search, mode: 'insensitive' };
  if (query.customerId) where.customerId = query.customerId;
  if (query.status) where.status = query.status;
  if (query.createdBy) where.createdBy = query.createdBy;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = query.from;
    if (query.to) where.createdAt.lte = query.to;
  }

  return where;
};

const normalizeItems = (items: ChallanItemInput[]) => {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const current = grouped.get(item.productId) ?? 0;
    grouped.set(item.productId, current + item.quantity);
  }

  return Array.from(grouped.entries()).map(([productId, quantity]) => ({ productId, quantity }));
};

const fetchProductSnapshots = async (productIds: string[]) => {
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: productSelect,
  });

  if (products.length !== productIds.length) {
    throw new ApiError(404, 'One or more products were not found or are inactive');
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  return productIds.map((id) => {
    const product = byId.get(id);
    if (!product) throw new ApiError(404, 'One or more products were not found or are inactive');
    return product;
  });
};

const ensureCustomerUsable = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, status: true },
  });

  if (!customer) throw new ApiError(404, 'Customer not found');
  if (customer.status === 'INACTIVE') throw new ApiError(409, 'Inactive customer cannot be used for challans');

  return customer;
};

const generateChallanNumber = async (tx: Prisma.TransactionClient) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260810)`;

  const count = await tx.challan.count();
  return `CH-${String(count + 1).padStart(6, '0')}`;
};

const createChallanItems = async (
  tx: Prisma.TransactionClient,
  challanId: string,
  products: Awaited<ReturnType<typeof fetchProductSnapshots>>,
  items: { productId: string; quantity: number }[]
) => {
  const itemData = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)!;
    const unitPrice = new Prisma.Decimal(product.unitPrice.toString());
    const quantity = new Prisma.Decimal(item.quantity);
    const total = unitPrice.mul(quantity);

    return {
      challanId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice,
      quantity: item.quantity,
      total,
    };
  });

  await tx.challanItem.createMany({ data: itemData });

  return itemData.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
    productName: item.productName,
    sku: item.sku,
  }));
};

const rebuildDraftItems = async (
  tx: Prisma.TransactionClient,
  challanId: string,
  products: Awaited<ReturnType<typeof fetchProductSnapshots>>,
  items: { productId: string; quantity: number }[]
) => {
  await tx.challanItem.deleteMany({ where: { challanId } });
  return createChallanItems(tx, challanId, products, items);
};

export const createChallanService = async (input: ChallanCreateInput, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await ensureCustomerUsable(input.customerId);

      const items = normalizeItems(input.items);
      const productSnapshots = await fetchProductSnapshots(items.map((item) => item.productId));

      const challanNumber = await generateChallanNumber(tx);
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => {
        const product = productSnapshots.find((entry) => entry.id === item.productId)!;
        return sum.add(new Prisma.Decimal(product.unitPrice.toString()).mul(item.quantity));
      }, new Prisma.Decimal(0));

      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: input.customerId,
          totalQuantity,
          totalAmount,
          status: ChallanStatus.DRAFT,
          createdBy: actorUserId,
        },
        select: challanSelect,
      });

      await createChallanItems(tx, challan.id, productSnapshots, items);

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'CREATE',
        entityType: 'CHALLAN',
        entityId: challan.id,
        description: 'Sales challan created',
      });

      const detail = await tx.challan.findUnique({
        where: { id: challan.id },
        select: challanDetailSelect,
      });

      if (!detail) throw new ApiError(404, 'Challan not found');

      return serializeChallan(detail as Parameters<typeof serializeChallan>[0]);
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const getChallansService = async (query: ChallanListQueryInput) => {
  const where = buildChallanWhere(query);
  const skip = (query.page - 1) * query.limit;

  try {
    const [total, challans] = await prisma.$transaction([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: challanListSelect,
      }),
    ]);

    return {
      data: challans.map((challan) => ({
        ...challan,
        totalAmount: serializeDecimal(challan.totalAmount),
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

export const getChallanByIdService = async (challanId: string) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: challanId },
      select: challanDetailSelect,
    });

    if (!challan) throw new ApiError(404, 'Challan not found');

    return serializeChallan(challan as Parameters<typeof serializeChallan>[0]);
  } catch (error) {
    handleDbError(error);
  }
};

export const updateDraftChallanService = async (
  challanId: string,
  input: ChallanUpdateInput,
  actorUserId: string
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.challan.findUnique({
        where: { id: challanId },
        select: { id: true, status: true },
      });

      if (!existing) throw new ApiError(404, 'Challan not found');
      if (existing.status !== ChallanStatus.DRAFT) {
        throw new ApiError(409, 'Only draft challans can be updated');
      }

      const currentChallan = await tx.challan.findUnique({
        where: { id: challanId },
        select: { customerId: true },
      });

      if (!currentChallan) throw new ApiError(404, 'Challan not found');

      const customerId = input.customerId ?? currentChallan.customerId;
      await ensureCustomerUsable(customerId);

      let products: Awaited<ReturnType<typeof fetchProductSnapshots>> | undefined;
      let items: { productId: string; quantity: number }[] | undefined;

      if (input.items) {
        items = normalizeItems(input.items);
        products = await fetchProductSnapshots(items.map((item) => item.productId));
      }

      const updatedChallan = await tx.challan.update({
        where: { id: challanId },
        data: {
          ...(input.customerId ? { customerId: input.customerId } : {}),
          ...(items ? { totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0) } : {}),
          ...(items && products
            ? {
                totalAmount: items.reduce((sum, item) => {
                  const product = products!.find((entry) => entry.id === item.productId)!;
                  return sum.add(new Prisma.Decimal(product.unitPrice.toString()).mul(item.quantity));
                }, new Prisma.Decimal(0)),
              }
            : {}),
        },
        select: challanSelect,
      });

      if (items && products) {
        await rebuildDraftItems(tx, challanId, products, items);
      }

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'UPDATE',
        entityType: 'CHALLAN',
        entityId: challanId,
        description: 'Sales challan updated',
      });

      const detail = await tx.challan.findUnique({
        where: { id: challanId },
        select: challanDetailSelect,
      });

      if (!detail) throw new ApiError(404, 'Challan not found');

      return serializeChallan(detail as Parameters<typeof serializeChallan>[0]);
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const confirmChallanService = async (challanId: string, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        select: {
          id: true,
          challanNumber: true,
          status: true,
          customerId: true,
          totalQuantity: true,
          totalAmount: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: challanItemSelect,
          },
        },
      });

      if (!challan) throw new ApiError(404, 'Challan not found');
      if (challan.status === ChallanStatus.CONFIRMED) throw new ApiError(409, 'Challan is already confirmed');
      if (challan.status === ChallanStatus.CANCELLED) throw new ApiError(409, 'Cancelled challan cannot be confirmed');

      const itemsByProduct = challan.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const movements: Array<ReturnType<typeof serializeMovement>> = [];

      for (const item of itemsByProduct) {
        const reduced = await reduceStockAtomically(tx, item);
        if (reduced === 0) {
          throw new ApiError(409, 'Insufficient stock');
        }

        const movement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Sales Challan ${challan.challanNumber}`,
            createdBy: actorUserId,
          },
          select: movementSelect,
        });

        movements.push(serializeMovement(movement));
      }

      await tx.challan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.CONFIRMED },
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'CONFIRM',
        entityType: 'CHALLAN',
        entityId: challanId,
        description: 'Sales challan confirmed',
      });

      const confirmed = await tx.challan.findUnique({
        where: { id: challanId },
        select: challanDetailSelect,
      });

      if (!confirmed) throw new ApiError(404, 'Challan not found');

      return {
        challan: serializeChallan(confirmed as Parameters<typeof serializeChallan>[0]),
        stockMovements: movements,
      };
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const cancelChallanService = async (challanId: string, actorUserId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        select: { id: true, status: true },
      });

      if (!challan) throw new ApiError(404, 'Challan not found');
      if (challan.status === ChallanStatus.CONFIRMED) {
        throw new ApiError(409, 'Confirmed challan cannot be cancelled');
      }
      if (challan.status === ChallanStatus.CANCELLED) {
        throw new ApiError(409, 'Challan is already cancelled');
      }

      const cancelled = await tx.challan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.CANCELLED },
        select: challanDetailSelect,
      });

      await createAuditLog(tx, {
        userId: actorUserId,
        action: 'CANCEL',
        entityType: 'CHALLAN',
        entityId: challanId,
        description: 'Sales challan cancelled',
      });

      return serializeChallan(cancelled as Parameters<typeof serializeChallan>[0]);
    });
  } catch (error) {
    handleDbError(error);
  }
};

export const getChallanHistoryService = async (challanId: string) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: challanId },
      select: {
        id: true,
        challanNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!challan) throw new ApiError(404, 'Challan not found');

    const [auditLogs, stockMovements] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where: {
          entityType: 'CHALLAN',
          entityId: challanId,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        where: { reason: `Sales Challan ${challan.challanNumber}` },
        orderBy: { createdAt: 'desc' },
        select: movementSelect,
      }),
    ]);

    return {
      challan,
      auditLogs,
      stockMovements: stockMovements.map((movement) => serializeMovement(movement as Parameters<typeof serializeMovement>[0])),
    };
  } catch (error) {
    handleDbError(error);
  }
};