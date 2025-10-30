/* eslint-disable @typescript-eslint/no-explicit-any */

import { Prisma } from '@prisma/client';
import type { CreditUsage } from '@prisma/client';
import { CreditType, OperationType } from '@/db/constants';
import { getDbClient } from '@/db/prisma';

export class CreditUsageService {

  // Record Credit Usage
  async recordUsage(data: {
    userId: string;
    feature?: string;
    orderId?: string;
    creditType: string;
    operationType: string;
    creditsUsed: number;
  }, tx?: Prisma.TransactionClient): Promise<CreditUsage> {
    const client = getDbClient(tx);

    return await client.creditUsage.create({
      data: {
        userId: data.userId,
        feature: data.feature,
        orderId: data.orderId,
        creditType: data.creditType,
        operationType: data.operationType,
        creditsUsed: data.creditsUsed,
      },
    });
  }

  // Record Credit Operation (alias for recordUsage)
  async recordCreditOperation(data: {
    userId: string;
    feature?: string;
    orderId?: string;
    creditType: string;
    operationType: string;
    creditsUsed: number;
  }, tx?: Prisma.TransactionClient): Promise<CreditUsage> {
    return this.recordUsage(data, tx);
  }

  // Batch Record Credit Usage
  async recordBatchUsage(
    usages: Prisma.CreditUsageCreateManyInput[],
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = getDbClient(tx);
    const result = await client.creditUsage.createMany({
      data: usages,
    });
    return result.count;
  }

  // Get User Credit Usage History
  async getUserUsageHistory(
    userId: string,
    params?: {
      creditType?: string;
      operationType?: string;
      feature?: string;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
      orderBy?: Prisma.CreditUsageOrderByWithRelationInput;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ usage: CreditUsage[]; total: number }> {
    const client = getDbClient(tx);
    const where: Prisma.CreditUsageWhereInput = { userId, deleted: 0 };

    if (params?.creditType) {
      where.creditType = params.creditType;
    }

    if (params?.operationType) {
      where.operationType = params.operationType;
    }

    if (params?.feature) {
      where.feature = params.feature;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [usage, total] = await Promise.all([
      client.creditUsage.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 20,
        orderBy: params?.orderBy || { createdAt: 'desc' },
      }),
      client.creditUsage.count({ where }),
    ]);

    return { usage, total };
  }

  // Get Credit Usage Record by Order ID
  async getOrderUsage(orderId: string, tx?: Prisma.TransactionClient): Promise<CreditUsage[]> {
    const client = getDbClient(tx);

    return await client.creditUsage.findMany({
      where: { orderId, deleted: 0 },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get User Credit Usage Statistics
  async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    tx?: Prisma.TransactionClient
  ): Promise<{
    totalConsumed: number;
    totalRecharged: number;
    freeConsumed: number;
    paidConsumed: number;
    freeRecharged: number;
    paidRecharged: number;
    featureUsage: { feature: string; credits: number }[];
  }> {
    const client = getDbClient(tx);
    const where: Prisma.CreditUsageWhereInput = { userId, deleted: 0 };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get all usage records
    const allUsage = await client.creditUsage.findMany({
      where,
      select: {
        creditType: true,
        operationType: true,
        creditsUsed: true,
        feature: true,
      },
    });

    // Calculate statistics
    const stats = {
      totalConsumed: 0,
      totalRecharged: 0,
      freeConsumed: 0,
      paidConsumed: 0,
      freeRecharged: 0,
      paidRecharged: 0,
      featureUsage: [] as any[],
    };

    // Calculate usage statistics by feature
    const featureMap = new Map<string, number>();

    allUsage.forEach((usage) => {
      if (usage.operationType === OperationType.CONSUME) {
        stats.totalConsumed += usage.creditsUsed;
        if (usage.creditType === CreditType.FREE) {
          stats.freeConsumed += usage.creditsUsed;
        } else {
          stats.paidConsumed += usage.creditsUsed;
        }

        if (usage.feature) {
          featureMap.set(
            usage.feature,
            (featureMap.get(usage.feature) || 0) + usage.creditsUsed
          );
        }
      } else if (usage.operationType === OperationType.RECHARGE) {
        stats.totalRecharged += usage.creditsUsed;
        if (usage.creditType === CreditType.FREE) {
          stats.freeRecharged += usage.creditsUsed;
        } else {
          stats.paidRecharged += usage.creditsUsed;
        }
      }
    });

    // Convert feature usage statistics to array
    stats.featureUsage = Array.from(featureMap.entries())
      .map(([feature, credits]) => ({ feature, credits }))
      .sort((a, b) => b.credits - a.credits);

    return stats;
  }

  // Get Popular Features
  async getPopularFeatures(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
    tx?: Prisma.TransactionClient
  ): Promise<{ feature: string | null; totalCredits: number; usageCount: number }[]> {
    const client = getDbClient(tx);
    const where: Prisma.CreditUsageWhereInput = {
      operationType: OperationType.CONSUME,
      feature: { not: null },
      deleted: 0,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const result = await client.creditUsage.groupBy({
      by: ['feature'],
      where,
      _sum: {
        creditsUsed: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          creditsUsed: 'desc',
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      feature: item.feature,
      totalCredits: item._sum.creditsUsed || 0,
      usageCount: item._count,
    }));
  }

  // Get Daily Credit Usage Trend
  async getDailyUsageTrend(
    days: number = 30,
    userId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<{
    date: Date;
    consumed: number;
    recharged: number;
    free_consumed: number;
    paid_consumed: number;
    unique_users: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereCondition = userId ? `AND user_id = '${userId}'::uuid` : '';

    const client = getDbClient(tx);

    const result = await client.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN operation_type = 'consume' THEN credits_used ELSE 0 END) as consumed,
        SUM(CASE WHEN operation_type = 'recharge' THEN credits_used ELSE 0 END) as recharged,
        SUM(CASE WHEN credit_type = 'free' AND operation_type = 'consume' 
            THEN credits_used ELSE 0 END) as free_consumed,
        SUM(CASE WHEN credit_type = 'paid' AND operation_type = 'consume' 
            THEN credits_used ELSE 0 END) as paid_consumed,
        COUNT(DISTINCT user_id) as unique_users
      FROM credit_usage
      WHERE created_at >= ${startDate}
        AND deleted = 0
        ${Prisma.raw(whereCondition)}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return result as {
      date: Date;
      consumed: number;
      recharged: number;
      free_consumed: number;
      paid_consumed: number;
      unique_users: number;
    }[];
  }

  // Get Recent Credit Usage Operations
  async getRecentOperations(
    userId: string,
    limit: number = 10,
    tx?: Prisma.TransactionClient
  ): Promise<CreditUsage[]> {
    const client = getDbClient(tx);

    return await client.creditUsage.findMany({
      where: { userId, deleted: 0 },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Soft Delete Old Credit Usage Records
  async deleteOldRecords(daysToKeep: number = 365, tx?: Prisma.TransactionClient): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const client = getDbClient(tx);

    const result = await client.creditUsage.updateMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        deleted: 0,
      },
      data: {
        deleted: 1,
      },
    });

    return result.count;
  }

  // Get System-wide Credit Usage Statistics
  async getSystemStats(tx?: Prisma.TransactionClient): Promise<{
    totalUsers: number;
    totalOperations: number;
    totalConsumed: number;
    totalRecharged: number;
    avgDailyConsumption: number;
    avgDailyRecharge: number;
  }> {
    const client = getDbClient(tx);
    const [
      totalUsers,
      totalOperations,
      consumeStats,
      rechargeStats,
    ] = await Promise.all([
      client.creditUsage.groupBy({
        by: ['userId'],
        where: { deleted: 0 },
      }).then((result) => result.length),
      client.creditUsage.count({ where: { deleted: 0 } }),
      client.creditUsage.aggregate({
        where: { operationType: OperationType.CONSUME, deleted: 0 },
        _sum: { creditsUsed: true },
        _count: true,
      }),
      client.creditUsage.aggregate({
        where: { operationType: OperationType.RECHARGE, deleted: 0 },
        _sum: { creditsUsed: true },
        _count: true,
      }),
    ]);

    // Calculate operating days (from first record to now)
    const firstRecord = await client.creditUsage.findFirst({
      where: { deleted: 0 },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const operatingDays = firstRecord && firstRecord.createdAt
      ? Math.ceil((Date.now() - firstRecord.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    const totalConsumed = consumeStats._sum.creditsUsed || 0;
    const totalRecharged = rechargeStats._sum.creditsUsed || 0;

    return {
      totalUsers,
      totalOperations,
      totalConsumed,
      totalRecharged,
      avgDailyConsumption: Math.round(totalConsumed / operatingDays),
      avgDailyRecharge: Math.round(totalRecharged / operatingDays),
    };
  }

  // Check for Duplicate Operations
  async isDuplicateOperation(
    userId: string,
    orderId: string,
    operationType: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    const client = getDbClient(tx);
    const count = await client.creditUsage.count({
      where: {
        userId,
        orderId,
        operationType,
        deleted: 0,
      },
    });

    return count > 0;
  }
}

export const creditUsageService = new CreditUsageService();
