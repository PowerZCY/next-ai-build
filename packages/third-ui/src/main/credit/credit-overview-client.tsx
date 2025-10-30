'use client';

import { useMemo } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import type {
  CreditBucket,
  CreditBucketStatus,
  CreditOverviewData,
  SubscriptionInfo,
} from './types';

export interface CreditOverviewTranslations {
  summaryTitle: string;
  summaryDescription: string;
  totalLabel: string;
  bucketsTitle: string;
  bucketsEmpty: string;
  bucketsLimitLabel: string;
  bucketsUsedLabel: string;
  bucketStatus: {
    active: string;
    expiringSoon: string;
    expired: string;
  };
  bucketDefaultLabels: Record<string, string>;
  subscriptionTitle: string;
  subscriptionActive: string;
  subscriptionPeriodLabel: string;
  subscriptionManage: string;
  subscriptionInactive: string;
  buyCreditsLabel: string;
}

interface CreditOverviewClientProps {
  data: CreditOverviewData;
  locale: string;
  translations: CreditOverviewTranslations;
  className?: string;
  expiringSoonThresholdDays?: number;
}

interface NormalizedBucket extends CreditBucket {
  progress: number;
  computedLabel: string;
  computedStatus: CreditBucketStatus;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const formatNumber = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);

const formatRange = (locale: string, info: SubscriptionInfo) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const start = info.periodStart ? formatter.format(new Date(info.periodStart)) : '';
  const end = info.periodEnd ? formatter.format(new Date(info.periodEnd)) : '';
  return `${start} - ${end}`;
};

export function CreditOverviewClient({
  data,
  locale,
  translations,
  className,
  expiringSoonThresholdDays = 7,
}: CreditOverviewClientProps) {
  const buckets = useMemo<NormalizedBucket[]>(() => {
    return (data.buckets || []).map((bucket) => {
      const limit = Math.max(bucket.limit, 0);
      const rawProgress =
        typeof bucket.progressPercent === 'number'
          ? bucket.progressPercent
          : limit > 0
            ? (bucket.balance / limit) * 100
            : bucket.balance > 0
              ? 100
              : 0;

      const computedLabel =
        bucket.label ??
        translations.bucketDefaultLabels[bucket.kind] ??
        bucket.kind;

      const computedStatus =
        bucket.status ?? deriveStatus(bucket.expiresAt, expiringSoonThresholdDays);

      return {
        ...bucket,
        progress: clampPercent(rawProgress),
        computedLabel,
        computedStatus,
      };
    });
  }, [data.buckets, translations.bucketDefaultLabels, expiringSoonThresholdDays]);

  const hasBuckets = buckets.length > 0;
  const subscription = data.subscription;

  return (
    <section
      className={cn(
        'flex flex-col gap-6 rounded-3xl border border-[color:var(--color-fd-border)] bg-[var(--color-fd-background)] p-6 shadow-sm dark:shadow-none',
        className,
      )}
    >
      <header className="rounded-2xl border border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-muted)] p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-fd-muted-foreground)]">
          {translations.summaryTitle}
        </p>
        <div className="mt-3 text-4xl font-bold leading-tight text-[var(--color-fd-primary)]">
          {formatNumber(locale, data.totalBalance)}
          <span className="ml-2 text-base font-medium text-[color:var(--color-fd-muted-foreground)]">
            {translations.totalLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-[color:var(--color-fd-muted-foreground)]">
          {translations.summaryDescription}
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-fd-foreground)]">
            {translations.bucketsTitle}
          </h3>
        </div>
        {hasBuckets ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {buckets.map((bucket) => (
              <article
                key={bucket.kind}
                data-credit-kind={bucket.kind}
                className="flex h-full flex-col gap-3 rounded-2xl border border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-popover)] p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[color:var(--color-fd-foreground)]">
                      {bucket.computedLabel}
                    </h4>
                    <p className="text-sm text-[color:var(--color-fd-muted-foreground)]">
                      {translations.bucketsLimitLabel}{' '}
                      <span className="font-medium text-[color:var(--color-fd-foreground)]">
                        {formatNumber(locale, bucket.limit)}
                      </span>
                    </p>
                  </div>
                  {bucket.computedStatus ? (
                    <span
                      data-credit-status={bucket.computedStatus}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
                        bucket.computedStatus === 'active' &&
                          'border-transparent bg-[color:var(--color-fd-muted)] text-[color:var(--color-fd-foreground)]',
                        bucket.computedStatus === 'expiringSoon' &&
                          'border-transparent bg-[color:var(--color-fd-accent)] text-[color:var(--color-fd-accent-foreground)]',
                        bucket.computedStatus === 'expired' &&
                          'border-[var(--color-fd-primary)] text-[var(--color-fd-primary)]',
                      )}
                    >
                      {translations.bucketStatus[bucket.computedStatus]}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between text-sm font-semibold text-[color:var(--color-fd-foreground)]">
                    <span>
                      {translations.bucketsUsedLabel}{' '}
                      {formatNumber(locale, bucket.balance)}
                    </span>
                    <span>{bucket.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[color:var(--color-fd-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-fd-primary)] transition-all"
                      style={{ width: `${bucket.progress}%` }}
                    />
                  </div>
                  {bucket.description ? (
                    <p className="text-xs text-[color:var(--color-fd-muted-foreground)]">
                      {bucket.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-muted)] bg-opacity-40 p-6 text-sm text-[color:var(--color-fd-muted-foreground)]">
            {translations.bucketsEmpty}
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1 rounded-2xl border border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-popover)] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-fd-muted-foreground)]">
                {translations.subscriptionTitle}
              </p>
              {subscription ? (
                <>
                  <h4 className="text-lg font-semibold text-[color:var(--color-fd-foreground)]">
                    {subscription.planName}
                  </h4>
                  <p className="text-sm text-[color:var(--color-fd-muted-foreground)]">
                    {translations.subscriptionPeriodLabel}{' '}
                    <span className="font-medium text-[color:var(--color-fd-foreground)]">
                      {formatRange(locale, subscription)}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-[color:var(--color-fd-muted-foreground)]">
                  {translations.subscriptionInactive}
                </p>
              )}
            </div>
            {subscription ? (
              <a
                href={subscription.manageUrl}
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-fd-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-fd-primary)] transition-colors hover:bg-[color:var(--color-fd-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-fd-primary)]"
              >
                {translations.subscriptionManage}
              </a>
            ) : null}
          </div>
        </div>

        <a
          href={data.checkoutUrl}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-fd-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-fd-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-fd-primary)]"
        >
          {translations.buyCreditsLabel}
        </a>
      </footer>
    </section>
  );
}

function deriveStatus(
  expiresAt?: string,
  thresholdDays = 7,
): CreditBucketStatus {
  if (!expiresAt) {
    return 'active';
  }

  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return 'active';
  }

  const diff = differenceInDays(expires, new Date());
  if (diff < 0) {
    return 'expired';
  }
  if (diff <= thresholdDays) {
    return 'expiringSoon';
  }
  return 'active';
}

function differenceInDays(later: Date, earlier: Date): number {
  const msInDay = 86_400_000;
  return Math.floor((later.getTime() - earlier.getTime()) / msInDay);
}
