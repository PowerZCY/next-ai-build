/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { userAggregateService } from '@/agg/index';
import { XCredit, XSubscription, XUser } from '@third-ui/clerk/fingerprint';
import { extractFingerprintFromNextRequest } from '@third-ui/clerk/fingerprint/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  applyUserMockContext,
  fetchLatestUserContextByFingerprintId,
  fetchUserContextByClerkUserId,
  mapCreditToXCredit,
  mapSubscriptionToXSubscription,
  mapUserToXUser,
  type UserContextEntities,
} from '@/context/user-context-service';


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

/** 创建成功响应对象 */
function createSuccessResponse(params: {
  entities: UserContextEntities;
  isNewUser: boolean;
  options?: {
    totalUsersOnDevice?: number;
    hasAnonymousUser?: boolean;
  };
}): XUserResponse {
  const response: XUserResponse = {
    success: true,
    xUser: mapUserToXUser(params.entities.user),
    xCredit: params.entities.credit ? mapCreditToXCredit(params.entities.credit) : null,
    xSubscription: mapSubscriptionToXSubscription(params.entities.subscription),
    isNewUser: params.isNewUser,
    ...params.options,
  };

  return applyUserMockContext(response);
}

/** 创建错误响应 */
function createErrorResponse(message: string, status = 400): NextResponse {
  const errorResponse: ErrorResponse = { error: message };
  return NextResponse.json(errorResponse, { status });
}

const SOURCE_REF_MAX_LENGTH = 2048;

function normalizeSourceRef(ref: string | null): string | null {
  if (!ref) {
    return null;
  }

  const trimmed = ref.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > SOURCE_REF_MAX_LENGTH
    ? trimmed.slice(0, SOURCE_REF_MAX_LENGTH)
    : trimmed;
}

// 提取用户首次访问来源
function extractSourceRef(request: NextRequest): string | null {
  const headerRef = request.headers.get('referer') || request.headers.get('referrer');
  const customRef = request.headers.get('x-source-ref');
  const queryRef = request.nextUrl.searchParams.get('ref');

  const candidates = [headerRef, customRef, queryRef];
  for (const candidate of candidates) {
    const normalized = normalizeSourceRef(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

/**
 * 根据fingerprint_id查询用户并返回响应数据
 */
async function getUserByClerkId(clerkUserId: string): Promise<XUserResponse | null> {
  const entities = await fetchUserContextByClerkUserId(clerkUserId);
  if (!entities) {
    return null;
  }

  return createSuccessResponse({
    entities,
    isNewUser: false,
  });
}

/**
 * 根据fingerprint_id查询用户并返回响应数据
 */
async function getUserByFingerprintId(fingerprintId: string): Promise<XUserResponse | null> {
  const result = await fetchLatestUserContextByFingerprintId(fingerprintId);
  if (!result) {
    return null;
  }

  const { totalUsersOnDevice, hasAnonymousUser, ...entities } = result;

  return createSuccessResponse({
    entities,
    isNewUser: false,
    options: {
      totalUsersOnDevice,
      hasAnonymousUser,
    },
  });
}

/**
 * 通用的fingerprint处理逻辑
 */
async function handleFingerprintRequest(request: NextRequest, options: { createIfNotExists?: boolean; } = {}) {
  // 从请求中提取fingerprint ID
  const fingerprintId = extractFingerprintFromNextRequest(request);
  // 验证fingerprint ID
  if (!fingerprintId) {
    return createErrorResponse('Invalid or missing fingerprint ID');
  }
  console.log('Received fingerprintId:', fingerprintId);

  const { userId: clerkUserId } = await auth();
  try {
    // 优先根据 Clerk ID 查询（如果已登录）
    let existingUserResult: XUserResponse | null = null;
    if (clerkUserId) {
      // 已登录一律按照clerkUserId去查
      existingUserResult = await getUserByClerkId(clerkUserId);
      if (existingUserResult && existingUserResult.xUser.fingerprintId !== fingerprintId) {
        // 说明当前用户的指纹ID发生了改变，为什么呢？因为它使用同一账号去注册Clerk，Clerk判定是同一用户！
        // 这个时候一定以登录用户clerkUserId为准
        // 但是考虑到同一指纹ID本身可以绑定多个账号，所以这里什么都不做
        // 就是以当前登录用户去查他自己的数据就行！
        console.warn(`Current login user used diff fp_ids: ${clerkUserId}, db_fp_id=${existingUserResult.xUser.fingerprintId}, req_fp_id=${fingerprintId}`);
      }
    } else {
      // 其次才是检查是否已存在该fingerprint的用户
      existingUserResult = await getUserByFingerprintId(fingerprintId);
    }
    if (existingUserResult) {
      return NextResponse.json(existingUserResult);
    }

    // 如果不存在用户且不允许创建，返回404
    if (!options.createIfNotExists) {
      return createErrorResponse('User not found', 404);
    }

    const sourceRef = extractSourceRef(request);

    // 创建新的匿名用户
    const { newUser, credit } = await userAggregateService.initAnonymousUser(fingerprintId, { sourceRef: sourceRef??  undefined});

    console.log(`Created new anonymous user ${newUser.userId} with fingerprint ${fingerprintId}`);

    // 返回创建结果
    const response = createSuccessResponse({
      entities: {
        user: newUser,
        credit,
        subscription: null,
      },
      isNewUser: true,
    });
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
