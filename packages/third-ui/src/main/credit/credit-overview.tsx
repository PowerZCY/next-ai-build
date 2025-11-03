import { getTranslations } from 'next-intl/server';
import { CreditOverviewClient } from './credit-overview-client';
import type { CreditOverviewTranslations } from './credit-overview-client';
import type { CreditOverviewData } from './types';

export interface CreditOverviewProps {
  locale: string;
  data: CreditOverviewData;
  className?: string;
  expiringSoonThresholdDays?: number;
}

export async function CreditOverview({
  locale,
  data,
  className,
  expiringSoonThresholdDays,
}: CreditOverviewProps) {
  const t = await getTranslations({ locale, namespace: 'credit' });

  const translations: CreditOverviewTranslations = {
    summaryDescription: t('summary.description'),
    totalLabel: t('summary.totalLabel'),
    bucketsTitle: t('buckets.title'),
    bucketsEmpty: t('buckets.empty'),
    bucketStatus: {
      active: t('buckets.status.active'),
      expiringSoon: t('buckets.status.expiringSoon'),
      expired: t('buckets.status.expired'),
    },
    bucketDefaultLabels: getBucketLabels(t),
    subscriptionActive: t('subscription.active'),
    subscriptionPeriodLabel: t('subscription.periodLabel'),
    subscriptionManage: t('subscription.manage'),
    subscriptionInactive: t('subscription.inactive'),
    subscribePay: t('subscription.pay'),
    onetimeBuy: t('onetime.buy'),
  };

  return (
    <CreditOverviewClient
      data={data}
      locale={locale}
      translations={translations}
      className={className}
      expiringSoonThresholdDays={expiringSoonThresholdDays}
    />
  );
}

function getBucketLabels(
  t: Awaited<ReturnType<typeof getTranslations>>,
): Record<string, string> {
  const labels = t.raw('buckets.labels') as Record<string, string>;
  return labels ?? {};
}
