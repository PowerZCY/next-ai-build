/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { userAggregateService } from '@/agg/index';
import { creditService, subscriptionService, userService } from '@/db/index';
import { Credit, Subscription, User } from '@/db/prisma-model-type';
import { viewLocalTime } from '@lib/utils';
import { XCredit, XSubscription, XUser } from '@third-ui/clerk/fingerprint';
import { extractFingerprintFromNextRequest } from '@third-ui/clerk/fingerprint/server';
import { NextRequest, NextResponse } from 'next/server';


// ==================== 类型定义 ====================

/** 成功响应数据 */
interface XUserResponse {
  success: true;
  xUser: XUser;
  xCredit: XCredit | null;
  xSubscription: XSubscription | null;
  isNewUser: boolean;
  totalUsersOnDevice?: number;
  hasAnonymousUser?: boolean;
}

/** 错误响应数据 */
interface ErrorResponse {
  error: string;
}

// ==================== 工具函数 ====================

/** 创建用户信息对象 */
function createUserInfo(user: User): XUser {
  return {
    userId: user.userId,
    fingerprintId: user.fingerprintId || '',
    clerkUserId: user.clerkUserId || '',
    stripeCusId: user.stripeCusId || '',
    email: user.email || '',
    status: user.status,
    createdAt: user.createdAt?.toISOString() || '',
  };
}

/** 创建积分信息对象 */
function createCreditsInfo(credit: Credit): XCredit {
  return {
    balanceFree: credit.balanceFree,
    totalFreeLimit: credit.totalFreeLimit,
    freeStart: viewLocalTime(credit.freeStart),
    freeEnd: viewLocalTime(credit.freeEnd),
    balancePaid: credit.balancePaid,
    totalPaidLimit: credit.totalPaidLimit,
    paidStart: viewLocalTime(credit.paidStart),
    paidEnd: viewLocalTime(credit.paidEnd),
    balanceOneTimePaid: credit.balanceOneTimePaid,
    totalOneTimePaidLimit: credit.totalOneTimePaidLimit,
    oneTimePaidStart: viewLocalTime(credit.oneTimePaidStart),
    oneTimePaidEnd: viewLocalTime(credit.oneTimePaidEnd),
    totalBalance: credit.balanceFree + credit.balancePaid + credit.balanceOneTimePaid,
  };
}

/** 创建订阅信息对象 */
function createSubscriptionInfo(subscription: Subscription | null): XSubscription | null {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    userId: subscription.userId || '',
    paySubscriptionId: subscription.paySubscriptionId || '',
    orderId: subscription.orderId || '',
    priceId: subscription.priceId || '',
    priceName: subscription.priceName || '',
    status: subscription.status || '',
    creditsAllocated: subscription.creditsAllocated,
    subPeriodStart: viewLocalTime(subscription.subPeriodStart),
    subPeriodEnd: viewLocalTime(subscription.subPeriodEnd)
  };
}

/** 创建成功响应对象 */
function createSuccessResponse(
  user: User,
  credit: Credit | null,
  subscription: Subscription | null,
  isNewUser: boolean,
  options: {
    totalUsersOnDevice?: number;
    hasAnonymousUser?: boolean;
  } = {}
): XUserResponse {
  return {
    success: true,
    xUser: createUserInfo(user),
    xCredit: credit ? createCreditsInfo(credit) : null,
    xSubscription: createSubscriptionInfo(subscription),
    isNewUser,
    ...options,
  };
}

/** 创建错误响应 */
function createErrorResponse(message: string, status = 400): NextResponse {
  const errorResponse: ErrorResponse = { error: message };
  return NextResponse.json(errorResponse, { status });
}

/**
 * 根据fingerprint_id查询用户并返回响应数据
 */
async function getUserByFingerprintId(fingerprintId: string): Promise<XUserResponse | null> {
  const existingUsers = await userService.findListByFingerprintId(fingerprintId);
  
  if (existingUsers.length === 0) {
    return null;
  }

  // 查找最新的匿名用户
  const latestAnonymousUser = existingUsers[0];
  // 找到匿名用户，返回匿名用户信息和积分
  const credit = await creditService.getCredit(latestAnonymousUser.userId);
  const subscription = await subscriptionService.getActiveSubscription(latestAnonymousUser.userId);
  
  return createSuccessResponse(
    latestAnonymousUser,
    credit,
    subscription,
    false,
    {
      totalUsersOnDevice: existingUsers.length,
      hasAnonymousUser: true,
    }
  );
}

/**
 * 通用的fingerprint处理逻辑
 */
async function handleFingerprintRequest(request: NextRequest, options: { createIfNotExists?: boolean; } = {}) {
  try {
    // 从请求中提取fingerprint ID
    const fingerprintId = extractFingerprintFromNextRequest(request);

    // 验证fingerprint ID
    if (!fingerprintId) {
      return createErrorResponse('Invalid or missing fingerprint ID');
    }

    console.log('Received fingerprintId:', fingerprintId);

    // 检查是否已存在该fingerprint的用户
    const existingUserResult = await getUserByFingerprintId(fingerprintId);
    
    if (existingUserResult) {
      checkMock(existingUserResult);
      return NextResponse.json(existingUserResult);
    }

    // 如果不存在用户且不允许创建，返回404
    if (!options.createIfNotExists) {
      return createErrorResponse('User not found', 404);
    }

    // 创建新的匿名用户
    const { newUser, credit } = await userAggregateService.initAnonymousUser(fingerprintId);

    console.log(`Created new anonymous user ${newUser.userId} with fingerprint ${fingerprintId}`);

    // 返回创建结果
    const response = createSuccessResponse(newUser, credit, null, true);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Fingerprint request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * 匿名用户初始化API
 * POST /api/user/anonymous/init
 */
export async function POST(request: NextRequest) {
  return handleFingerprintRequest(request, { createIfNotExists: true });
}

function checkMock(existingUserResult: XUserResponse) {
  const mockEnabled = process.env.MONEY_PRICE_MOCK_USER_ENABLED === 'true';
  const mockType = Number(process.env.MONEY_PRICE_MOCK_USER_TYPE ?? NaN);

  if (mockEnabled && Number.isInteger(mockType) && mockType >= 0 && mockType <= 4) {
    const ensureSubscription = () => {
      if (!existingUserResult.xSubscription) {
        const now = new Date();
        existingUserResult.xSubscription = {
          id: BigInt(99999),
          userId: existingUserResult.xUser.userId,
          paySubscriptionId: 'MOCK-PAY-SUB-ID',
          orderId: '',
          priceId: '',
          priceName: 'MOCK-TEST',
          status: 'active',
          creditsAllocated: 0,
          subPeriodStart: now.toISOString(),
          subPeriodEnd: now.toISOString()
        };
      }
      return existingUserResult.xSubscription;
    };

    switch (mockType) {
      case 0: {
        const subscription = ensureSubscription();
        subscription.status = '';
        subscription.priceId = '';
        break;
      }
      case 1: {
        const subscription = ensureSubscription();
        subscription.priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || subscription.priceId;
        break;
      }
      case 2: {
        const subscription = ensureSubscription();
        subscription.priceId = process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID || subscription.priceId;
        break;
      }
      case 3: {
        const subscription = ensureSubscription();
        subscription.priceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID || subscription.priceId;
        break;
      }
      case 4: {
        const subscription = ensureSubscription();
        subscription.priceId = process.env.STRIPE_ULTRA_YEARLY_PRICE_ID || subscription.priceId;
        break;
      }
      default:
        break;
    }
  }
}
