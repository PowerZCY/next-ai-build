// Fix BigInt serialization issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { userService, creditService, creditUsageService, subscriptionService, Apilogger } from '@/services/database';
import { UserStatus, CreditType, OperationType } from '@/services/database';
import { freeAmount } from '@/lib/appConfig';

// 定义Clerk Webhook事件类型
interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses?: Array<{
      email_address: string;
    }>;
    unsafe_metadata?: {
      user_id?: string;
      fingerprint_id?: string;
    };
    deleted?: boolean;
    object?: string;
  };
  event_attributes?: {
    http_request?: {
      client_ip?: string;
      user_agent?: string;
    };
  };
  instance_id?: string;
  object: string;
  timestamp: number;
  type: 'user.created' | 'user.deleted';
}

// 免费积分配置
const FREE_CREDITS_AMOUNT = freeAmount;

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const rawBody = await request.text();

    let event: ClerkWebhookEvent;

    // 开发环境跳过签名校验
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: skipping webhook signature verification');
      try {
        event = JSON.parse(rawBody) as ClerkWebhookEvent;
      } catch (err) {
        console.error('Failed to parse webhook body:', err);
        return NextResponse.json(
          { error: 'Invalid webhook body' },
          { status: 400 }
        );
      }
    } else {
      // 生产环境进行签名校验
      const headerPayload = await headers();
      const svix_id = headerPayload.get('svix-id');
      const svix_timestamp = headerPayload.get('svix-timestamp');
      const svix_signature = headerPayload.get('svix-signature');

      // 如果缺少必要的header，返回错误
      if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
          { error: 'Missing webhook headers' },
          { status: 400 }
        );
      }

      // 获取webhook signing secret
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('CLERK_WEBHOOK_SECRET is not configured');
        return NextResponse.json(
          { error: 'Webhook configuration error' },
          { status: 500 }
        );
      }

      // 验证webhook签名
      try {
        const wh = new Webhook(webhookSecret);
        event = wh.verify(rawBody, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        }) as ClerkWebhookEvent;
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    }

    // Log the incoming webhook
    const logId = await Apilogger.logClerkIncoming(`${event.type}`, {
      clerk_user_id: event.data.id,
      email: event.data.email_addresses?.[0]?.email_address,
      fingerprint_id: event.data.unsafe_metadata?.fingerprint_id
    }, event);

    let processingResult = { success: true, message: 'Event processed successfully' };

    try {
      // 处理不同的事件类型
      const { type } = event;

      switch (type) {
        case 'user.created':
          await handleUserCreated(event);
          break;
        case 'user.deleted':
          await handleUserDeleted(event);
          break;
        default:
          console.log(`Unhandled event type: ${type}`);
          processingResult = { success: false, message: `Unhandled event type: ${type}`};
      }

      // Update response in log
      Apilogger.updateResponse(logId, processingResult);

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Update error response in log
      const errorResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
      Apilogger.updateResponse(logId, errorResult);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 处理用户创建事件
 */
async function handleUserCreated(event: ClerkWebhookEvent) {
  const { data } = event;
  const clerkUserId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const unsafeMetadata = data.unsafe_metadata;
  const fingerprintId = unsafeMetadata?.fingerprint_id;

  console.log('Processing user.created event:', {
    clerkUserId,
    email,
    fingerprintId
  });

  // 检查必要参数
  if (!fingerprintId) {
    console.error('Missing fingerprintId in webhook data, process flow error');
    return;
  }

  if (!email) {
    console.error('Missing email in webhook data');
    return;
  }

  try {
    // 按fingerprintId查询该设备的所有用户记录
    const existingUsers = await userService.findListByFingerprintId(fingerprintId);
    if (!existingUsers || existingUsers.length === 0) {
      console.error('Invalid fingerprintId in webhook data, process flow error');
      return;
    }

    // 查找email相同的记录
    const sameEmailUser = existingUsers.find(user => user.email === email);
    if (sameEmailUser) {
      // 同一账号，检查是否需要更新clerkUserId
      if (sameEmailUser.clerkUserId !== clerkUserId) {
        await userService.updateUser(sameEmailUser.userId, { clerkUserId });
        console.log(`Updated clerkUserId for user ${sameEmailUser.userId}`);
      } else {
        console.log(`User with email ${email} already exists, skipping duplicate message`);
      }
      return;
    }

    // 查找匿名用户（email为空且clerkUserId为空）
    const anonymousUser = existingUsers.find(user => 
      !user.email && !user.clerkUserId && user.status === UserStatus.ANONYMOUS
    );
    if (anonymousUser) {
      // 匿名用户升级
      await userService.upgradeToRegistered(anonymousUser.userId, {
        email,
        clerkUserId
      });
      console.log(`Successfully upgraded anonymous user ${anonymousUser.userId} to registered user`);
      return;
    }

    // 同设备新账号，创建新用户
    await createNewRegisteredUser(clerkUserId, email, fingerprintId);
    console.log(`Created new user for device ${fingerprintId} with email ${email}`);
    
  } catch (error) {
    console.error('Error handling user.created event:', error);
    throw error;
  }
}

/**
 * 处理用户删除事件
 */
async function handleUserDeleted(event: ClerkWebhookEvent) {
  const { data } = event;
  const clerkUserId = data.id;

  console.log('Processing user.deleted event:', { clerkUserId });

  try {
    // 根据clerkUserId查找用户
    const user = await userService.findByClerkUserId(clerkUserId);
    
    if (!user) {
      console.log(`User with clerkUserId ${clerkUserId} not found`);
      return;
    }

    // 备份用户数据并硬删除用户
    await userService.hardDeleteUser(user.userId);
    
    console.log(`Successfully deleted user ${user.userId} (clerkUserId: ${clerkUserId})`);
    
  } catch (error) {
    console.error('Error handling user.deleted event:', error);
    throw error;
  }
}

/**
 * 创建新的注册用户
 *
 * 初始化步骤（与 credit 平行）：
 * 1. 创建 User 记录
 * 2. 初始化 Credit 记录（免费积分）
 * 3. 初始化 Subscription 记录（占位符，status=INCOMPLETE）
 * 4. 记录 CreditUsage（审计）
 *
 * 后续当用户通过 Stripe 订阅时：
 * - session.completed 或 invoice.paid 会 UPDATE subscription 记录
 * - 不需要 CREATE，只需 UPDATE 确保逻辑一致
 */
async function createNewRegisteredUser(
  clerkUserId: string,
  email?: string,
  fingerprintId?: string
) {
  // 创建新用户
  const newUser = await userService.createUser({
    clerkUserId,
    email,
    fingerprintId,
    status: UserStatus.REGISTERED
  });

  // 初始化积分记录
  await creditService.initializeCredit(
    newUser.userId,
    FREE_CREDITS_AMOUNT,
    0 // 注册时只给免费积分，付费积分为0
  );

  // ✅ 初始化订阅记录（占位符）
  // 这样后续 Stripe webhook 可以直接 UPDATE，无需 CREATE
  // 确保所有订阅场景下的处理逻辑一致
  await subscriptionService.initializeSubscription(newUser.userId);

  // 记录免费积分充值记录
  await creditUsageService.recordCreditOperation({
    userId: newUser.userId,
    feature: 'user_registration',
    creditType: CreditType.FREE,
    operationType: OperationType.RECHARGE,
    creditsUsed: FREE_CREDITS_AMOUNT
  });

  console.log(`Created new registered user ${newUser.userId} with ${FREE_CREDITS_AMOUNT} free credits and initialized subscription placeholder`);
}