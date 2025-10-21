/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  creditUsageService,
  CreditType,
  OperationType 
} from '@/services/database';
import { ApiAuthUtils } from '@/lib/auth-utils';

// Query parameters schema
const usageHistoryQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  creditType: z.enum([CreditType.FREE, CreditType.PAID]).optional(),
  operationType: z.enum([OperationType.CONSUME, OperationType.RECHARGE, OperationType.FREEZE, OperationType.UNFREEZE]).optional(),
  feature: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const creditType = searchParams.get('creditType') as CreditType | undefined;
    const operationType = searchParams.get('operationType') as OperationType | undefined;
    const feature = searchParams.get('feature');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate parameters
    const params = usageHistoryQuerySchema.parse({
      page,
      limit,
      creditType,
      operationType,
      feature,
      startDate,
      endDate,
    });

    // 使用统一认证工具获取用户信息（避免重复查询）
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // Build filters
    const filters: any = {};
    if (params.creditType) filters.creditType = params.creditType;
    if (params.operationType) filters.operationType = params.operationType;
    if (params.feature) filters.feature = params.feature;
    if (params.startDate) filters.startDate = new Date(params.startDate);
    if (params.endDate) filters.endDate = new Date(params.endDate);

    // Get usage history with pagination
    const offset = (params.page - 1) * params.limit;
    const usageHistory = await creditUsageService.getUserUsageHistory(user.userId, { take: params.limit, skip: offset, orderBy: { createdAt: 'desc' } });

    // Get total count for pagination
    const totalCount = 0; // TODO: implement count method

    // Process usage data
    const processedUsage = usageHistory.usage.map((usage: any) => ({
      id: usage.id,
      feature: usage.feature,
      orderId: usage.orderId,
      creditType: usage.creditType,
      operationType: usage.operationType,
      creditsUsed: usage.creditsUsed,
      createdAt: usage.createdAt,
      
      // Add descriptive information
      description: generateUsageDescription(usage),
    }));

    // Calculate summary statistics for the current filter
    const summary = await calculateUsageSummary(user.userId);

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPrevPage = params.page > 1;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          status: user.status,
          isRegistered: !!user.email && !!user.clerkUserId,
        },
        usage: processedUsage,
        summary,
        pagination: {
          page: params.page,
          limit: params.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          creditType: params.creditType,
          operationType: params.operationType,
          feature: params.feature,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    });

  } catch (error) {
    console.error('Get usage history error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get usage history' },
      { status: 500 }
    );
  }
}

// Helper function to generate usage description
function generateUsageDescription(usage: any): string {
  const { operationType, creditType, creditsUsed, feature } = usage;
  
  switch (operationType) {
    case OperationType.CONSUME:
      return `使用了 ${creditsUsed} 个${creditType === CreditType.FREE ? '免费' : '付费'}积分${feature ? ` (${feature})` : ''}`;
    case OperationType.RECHARGE:
      return `充值了 ${creditsUsed} 个${creditType === CreditType.FREE ? '免费' : '付费'}积分`;
    case OperationType.FREEZE:
      return `冻结了 ${creditsUsed} 个${creditType === CreditType.FREE ? '免费' : '付费'}积分`;
    case OperationType.UNFREEZE:
      return `解冻了 ${creditsUsed} 个${creditType === CreditType.FREE ? '免费' : '付费'}积分`;
    default:
      return `${operationType} ${creditsUsed} 个${creditType === CreditType.FREE ? '免费' : '付费'}积分`;
  }
}

// Helper function to calculate usage summary
async function calculateUsageSummary(userId: string) {
  // Note: This is a simplified version. In a real implementation, 
  // you might want to run aggregate queries in the database service
  try {
    const allUsage = await creditUsageService.getUserUsageHistory(userId, { take: 1000, orderBy: { createdAt: 'desc' } });
    
    const summary = allUsage.usage.reduce((acc: any, usage: any) => {
      const key = `${usage.operationType}_${usage.creditType}`;
      if (!acc[key]) {
        acc[key] = {
          operationType: usage.operationType,
          creditType: usage.creditType,
          totalCredits: 0,
          count: 0,
        };
      }
      acc[key].totalCredits += usage.creditsUsed;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(summary);
  } catch (error) {
    console.error('Failed to calculate usage summary:', error);
    return [];
  }
}