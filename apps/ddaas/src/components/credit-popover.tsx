import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { CreditOverview } from '@third-ui/main/server';
import type { CreditOverviewData } from '@third-ui/main/server';
import { creditService, subscriptionService } from '@/services/database';
import { CreditNavButton } from '@third-ui/main';

interface CreditPopoverProps {
  locale: string;
}

export async function CreditPopover({ locale }: CreditPopoverProps) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  const [credit, subscription, t] = await Promise.all([
    creditService.getCredit(clerkUserId),
    subscriptionService.getActiveSubscription(clerkUserId),
    getTranslations({ locale, namespace: 'credit' }),
  ]);

  if (!credit) {
    return null;
  }

  const totalBalance =
    (credit.balanceFree ?? 0) +
    (credit.balancePaid ?? 0) +
    (credit.balanceOneTimePaid ?? 0);

  const data: CreditOverviewData = {
    totalBalance,
    checkoutUrl: '#',
    buckets: [
      {
        kind: 'free',
        balance: credit.balanceFree ?? 0,
        limit: credit.totalFreeLimit ?? 0,
        expiresAt: credit.freeEnd?.toISOString(),
      },
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
    ],
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
      title={t('summary.title')}
      totalLabel={t('summary.totalLabel')}
    >
      <CreditOverview locale={locale} data={data} />
    </CreditNavButton>
  );
}
