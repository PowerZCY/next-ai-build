import { creditService, subscriptionService, userService } from '../database/index';
import type { Credit, Subscription, User } from '../database/prisma-model-type';
import { viewLocalTime } from '@windrun-huaiin/lib/utils';
import type { XCredit, XSubscription, XUser } from '@windrun-huaiin/third-ui/fingerprint';
import type { InitUserContext } from '@windrun-huaiin/third-ui/main/server';

export interface UserContextEntities {
  user: User;
  credit: Credit | null;
  subscription: Subscription | null;
}

export interface FingerprintUserContext extends UserContextEntities {
  totalUsersOnDevice: number;
  hasAnonymousUser: boolean;
}

export function mapUserToXUser(user: User): XUser {
  return {
    userId: user.userId,
    userName: user.userName || '',
    fingerprintId: user.fingerprintId || '',
    clerkUserId: user.clerkUserId || '',
    stripeCusId: user.stripeCusId || '',
    email: user.email || '',
    status: user.status,
    createdAt: viewLocalTime(user.createdAt),
  };
}

export function mapCreditToXCredit(credit: Credit): XCredit {
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

export function mapSubscriptionToXSubscription(
  subscription: Subscription | null,
): XSubscription | null {
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
    subPeriodEnd: viewLocalTime(subscription.subPeriodEnd),
  };
}

export function buildInitUserContextFromEntities(params: {
  user: User;
  credit: Credit | null;
  subscription: Subscription | null;
  isClerkAuthenticated?: boolean;
}): InitUserContext {
  return {
    fingerprintId: params.user.fingerprintId || null,
    xUser: mapUserToXUser(params.user),
    xCredit: params.credit ? mapCreditToXCredit(params.credit) : null,
    xSubscription: mapSubscriptionToXSubscription(params.subscription),
    isClerkAuthenticated: params.isClerkAuthenticated ?? true,
  };
}

export async function fetchUserContextByClerkUserId(
  clerkUserId: string,
): Promise<UserContextEntities | null> {
  const user = await userService.findByClerkUserId(clerkUserId);

  if (!user) {
    return null;
  }

  const [credit, subscription] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
  ]);

  return { user, credit, subscription };
}

export async function fetchLatestUserContextByFingerprintId(
  fingerprintId: string,
): Promise<FingerprintUserContext | null> {
  const existingUsers = await userService.findListByFingerprintId(fingerprintId);
  if (existingUsers.length === 0) {
    return null;
  }

  const latestAnonymousUser = existingUsers[0];
  const [credit, subscription] = await Promise.all([
    creditService.getCredit(latestAnonymousUser.userId),
    subscriptionService.getActiveSubscription(latestAnonymousUser.userId),
  ]);

  return {
    user: latestAnonymousUser,
    credit,
    subscription,
    totalUsersOnDevice: existingUsers.length,
    hasAnonymousUser: true,
  };
}

type MockableContext = {
  xUser: XUser | null;
  xSubscription: XSubscription | null;
};

export function applyUserMockContext<T extends MockableContext>(context: T): T {
  const mockEnabled = process.env.MONEY_PRICE_MOCK_USER_ENABLED === 'true';
  const mockType = Number(process.env.MONEY_PRICE_MOCK_USER_TYPE ?? NaN);

  if (
    !context.xUser ||
    !mockEnabled ||
    !Number.isInteger(mockType) ||
    mockType < 0 ||
    mockType > 4
  ) {
    return context;
  }

  const ensureSubscription = () => {
    if (!context.xSubscription) {
      const now = new Date();
      context.xSubscription = {
        id: BigInt(99999),
        userId: context.xUser!.userId,
        paySubscriptionId: 'MOCK-PAY-SUB-ID',
        orderId: '',
        priceId: '',
        priceName: 'MOCK-TEST',
        status: 'active',
        creditsAllocated: 0,
        subPeriodStart: viewLocalTime(now),
        subPeriodEnd: viewLocalTime(now),
      };
    }

    return context.xSubscription!;
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
      subscription.priceId =
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 2: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 3: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_PRO_YEARLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 4: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_ULTRA_YEARLY_PRICE_ID || subscription.priceId;
      break;
    }
    default:
      break;
  }

  return context;
}
