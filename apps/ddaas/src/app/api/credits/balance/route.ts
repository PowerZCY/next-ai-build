/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  creditService,
  creditUsageService 
} from '@/services/database';
import { ApiAuthUtils } from '@/lib/auth-utils';

// Query parameters schema - commented out as not used currently
// const balanceQuerySchema = z.object({
//   includeUsageHistory: z.boolean().default(false),
// });

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeUsageHistory = searchParams.get('includeUsageHistory') === 'true';

    // 使用统一认证工具获取用户信息（避免重复查询）
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // Get user's credits
    const credits = await creditService.getCredit(user.userId);

    if (!credits) {
      return NextResponse.json(
        { error: 'Credits record not found' },
        { status: 404 }
      );
    }

    // Calculate credit statistics
    const totalBalance = credits.balanceFree + credits.balancePaid;
    const totalEverReceived = credits.totalFreeLimit + credits.totalPaidLimit;
    const totalUsed = totalEverReceived - totalBalance;

    const creditBalance = {
      // Current balances
      balanceFree: credits.balanceFree,
      balancePaid: credits.balancePaid,
      totalBalance,
      
      // Limits (total ever received)
      totalFreeLimit: credits.totalFreeLimit,
      totalPaidLimit: credits.totalPaidLimit,
      totalEverReceived,
      
      // Usage statistics
      totalUsed,
      freeUsed: credits.totalFreeLimit - credits.balanceFree,
      paidUsed: credits.totalPaidLimit - credits.balancePaid,
      
      // Metadata
      updatedAt: credits.updatedAt,
      
      // Usage percentage
      usagePercentage: totalEverReceived > 0 ? Math.round((totalUsed / totalEverReceived) * 100) : 0,
    };

    let usageHistory: Array<Record<string, any>> = [];
    
    if (includeUsageHistory) {
      // Get recent usage history (last 50 records)
      const recentUsage = await creditUsageService.getUserUsageHistory(user.userId, { take: 50, orderBy: { createdAt: 'desc' } });

      usageHistory = recentUsage.usage.map((usage: Record<string, any>) => ({
        id: usage.id,
        feature: usage.feature,
        orderId: usage.orderId,
        creditType: usage.creditType,
        operationType: usage.operationType,
        creditsUsed: usage.creditsUsed,
        createdAt: usage.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          status: user.status,
          isRegistered: !!user.email && !!user.clerkUserId,
        },
        balance: creditBalance,
        ...(includeUsageHistory && { recentUsage: usageHistory }),
      },
    });

  } catch (error) {
    console.error('Get credit balance error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get credit balance' },
      { status: 500 }
    );
  }
}