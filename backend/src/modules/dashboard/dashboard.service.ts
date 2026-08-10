import { ChallanStatus, CustomerStatus, Prisma, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../common/utils/apiError.js';

const handleDbError = (error: unknown): never => {
  if (typeof error === 'object' && error !== null) {
    const dbError = error as { code?: string; message?: string };
    if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database")) {
      throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
    }
  }

  if (error instanceof ApiError) throw error;
  throw new ApiError(500, 'An unexpected error occurred. Please try again.');
};

const serializeDecimal = (value: Prisma.Decimal | string | null | undefined) => {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? Number(value).toFixed(2) : value.toFixed(2);
};

const getBaseCounts = async () => {
  const [activeCustomers, activeProducts, totalUsers, draftChallans, confirmedChallans, lowStockRows] =
    await prisma.$transaction([
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "Product"
        WHERE "isActive" = true
          AND "currentStock" <= "minimumStock"
      `),
    ]);

  return {
    activeCustomers,
    activeProducts,
    totalUsers,
    draftChallans,
    confirmedChallans,
    lowStockProducts: Number(lowStockRows[0]?.count ?? 0n),
  };
};

const getLowStockProducts = async (limit = 10) => {
  const rows = await prisma.$queryRaw<
    Array<{
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
    }>
  >(Prisma.sql`
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
    WHERE "isActive" = true
      AND "currentStock" <= "minimumStock"
    ORDER BY "updatedAt" DESC
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
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
  }));
};

const getUpcomingFollowUps = async (limit = 10) => {
  const now = new Date();

  return prisma.customer.findMany({
    where: {
      followUpDate: {
        gte: now,
      },
      status: {
        not: CustomerStatus.INACTIVE,
      },
    },
    orderBy: { followUpDate: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      businessName: true,
      status: true,
      followUpDate: true,
      createdAt: true,
    },
  });
};

export const getDashboardService = async (role: Role, userId: string) => {
  try {
    const baseCounts = await getBaseCounts();
    const upcomingFollowUps = await getUpcomingFollowUps();

    if (role === Role.ADMIN) {
      const lowStockProducts = await getLowStockProducts();

      const [recentAuditLogs, recentMovements, recentChallans, recentUsers] =
        await prisma.$transaction([
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.stockMovement.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            productId: true,
            quantity: true,
            type: true,
            reason: true,
            createdAt: true,
            product: { select: { id: true, name: true, sku: true } },
            createdByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.challan.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalQuantity: true,
            totalAmount: true,
            createdAt: true,
            customer: { select: { id: true, name: true, businessName: true } },
            createdByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.user.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        }),
      ]);

      return {
        role: Role.ADMIN,
        counts: baseCounts,
        recentAuditLogs,
        recentMovements,
        recentChallans: recentChallans.map((challan) => ({
          ...challan,
          totalAmount: serializeDecimal(challan.totalAmount),
        })),
        recentUsers,
        lowStockProducts,
        upcomingFollowUps,
      };
    }

    if (role === Role.SALES) {
      const [recentCustomers, recentChallans, followUps, myAuditLogs] = await prisma.$transaction([
        prisma.customer.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            businessName: true,
            status: true,
            followUpDate: true,
            createdAt: true,
          },
        }),
        prisma.challan.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { createdBy: userId },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalQuantity: true,
            totalAmount: true,
            createdAt: true,
            customer: { select: { id: true, name: true, businessName: true } },
          },
        }),
        prisma.followUpNote.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { createdBy: userId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            customer: { select: { id: true, name: true, businessName: true, status: true } },
            createdByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { userId },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        role: Role.SALES,
        counts: baseCounts,
        recentCustomers,
        recentChallans: recentChallans.map((challan) => ({
          ...challan,
          totalAmount: serializeDecimal(challan.totalAmount),
        })),
        followUps,
        recentActivity: myAuditLogs,
        upcomingFollowUps,
      };
    }

    if (role === Role.WAREHOUSE) {
      const lowStockProducts = await getLowStockProducts();

      const [recentMovements, recentProducts] = await prisma.$transaction([
        prisma.stockMovement.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            productId: true,
            quantity: true,
            type: true,
            reason: true,
            createdAt: true,
            product: { select: { id: true, name: true, sku: true } },
            createdByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.product.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            currentStock: true,
            minimumStock: true,
            warehouseLocation: true,
            isActive: true,
          },
        }),
      ]);

      return {
        role: Role.WAREHOUSE,
        counts: baseCounts,
        lowStockProducts,
        recentMovements,
        recentProducts,
        upcomingFollowUps,
      };
    }

    if (role === Role.ACCOUNTS) {
      const [confirmedChallans, recentCustomers, salesSummary] = await prisma.$transaction([
        prisma.challan.findMany({
          where: { status: ChallanStatus.CONFIRMED },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true } },
            createdByUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.customer.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            businessName: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.challan.aggregate({
          where: {
            status: ChallanStatus.CONFIRMED,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          _count: true,
          _sum: {
            totalAmount: true,
          },
        }),
      ]);

      return {
        role: Role.ACCOUNTS,
        counts: baseCounts,
        confirmedChallans: confirmedChallans.map((challan) => ({
          ...challan,
          totalAmount: serializeDecimal(challan.totalAmount),
        })),
        recentCustomers,
        salesSummary: {
          count: salesSummary._count,
          totalAmount: serializeDecimal(salesSummary._sum.totalAmount),
        },
        upcomingFollowUps,
      };
    }

    return {
      role,
      counts: baseCounts,
      upcomingFollowUps,
    };
  } catch (error) {
    handleDbError(error);
  }
};
