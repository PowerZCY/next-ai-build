import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { CreditOverview } from '@third-ui/main/server';
import type { CreditOverviewData } from '@third-ui/main/server';
import { creditService, subscriptionService, userService } from '@/db/index';
import { CreditNavButton } from '@third-ui/main';

interface CreditPopoverProps {
  locale: string;
}

export async function CreditPopover({ locale }: CreditPopoverProps) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  const user = await userService.findByClerkUserId(clerkUserId);
  if (!user) {
    console.error('User not found!');
    return null;
  }

  const [credit, subscription, t] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
    getTranslations({ locale, namespace: 'credit' }),
  ]);

  if (!credit) {
    return null;
  }

  const totalBalance =
    (credit.balanceFree ?? 0) +
    (credit.balancePaid ?? 0) +
    (credit.balanceOneTimePaid ?? 0);

  // 根据是否订阅，动态调整 buckets 顺序
  // 已订阅：subscription → onetime → free
  // 未订阅：onetime → free
  const buckets = subscription
    ? [
        {
          kind: 'subscription',
          balance: credit.balancePaid ?? 0,
          limit: credit.totalPaidLimit ?? 0,
          expiresAt: credit.paidEnd?.toISOString(),
        },
        {
          kind: 'onetime',
          balance: credit.balanceOneTimePaid ?? 0,
          limit: credit.totalOneTimePaidLimit ?? 0,
          expiresAt: credit.oneTimePaidEnd?.toISOString(),
        },
        {
          kind: 'free',
          balance: credit.balanceFree ?? 0,
          limit: credit.totalFreeLimit ?? 0,
          expiresAt: credit.freeEnd?.toISOString(),
        },
      ]
    : [
        {
          kind: 'onetime',
          balance: credit.balanceOneTimePaid ?? 0,
          limit: credit.totalOneTimePaidLimit ?? 0,
          expiresAt: credit.oneTimePaidEnd?.toISOString(),
        },
        {
          kind: 'free',
          balance: credit.balanceFree ?? 0,
          limit: credit.totalFreeLimit ?? 0,
          expiresAt: credit.freeEnd?.toISOString(),
        },
      ];

  const data: CreditOverviewData = {
    totalBalance,
    checkoutUrl: '#',
    subscribeUrl: '#',
    buckets,
  };

  if (subscription) {
    data.subscription = {
      planName: subscription.priceName || t('subscription.active'),
      periodStart: subscription.subPeriodStart?.toISOString(),
      periodEnd: subscription.subPeriodEnd?.toISOString(),
      manageUrl: '#',
    };
  }

  return (
    <CreditNavButton
      locale={locale}
      totalBalance={totalBalance}
      totalLabel={t('summary.totalLabel')}
    >
      <CreditOverview locale={locale} data={data} />
    </CreditNavButton>
  );
}
