'use client';

import { useMemo, type ComponentType } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import type {
  CreditBucket,
  CreditBucketStatus,
  CreditOverviewData,
  SubscriptionInfo,
} from './types';

export interface CreditOverviewTranslations {
  summaryDescription: string;
  totalLabel: string;
  bucketsTitle: string;
  bucketsEmpty: string;
  bucketStatus: {
    active: string;
    expiringSoon: string;
    expired: string;
  };
  bucketDefaultLabels: Record<string, string>;
  subscriptionActive: string;
  subscriptionPeriodLabel: string;
  subscriptionManage: string;
  subscriptionInactive: string;
  subscribePay?: string;
  onetimeBuy: string;
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
  const InfoIcon = ( icons.Info ) as ComponentType<{ className?: string }>;

  return (
    <section
      className={cn(
        'flex flex-col gap-6 rounded-2xl border border-[color:var(--color-fd-border)] bg-[var(--color-fd-background)] p-6 shadow-sm dark:shadow-none',
        className,
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-br from-[var(--color-fd-primary)]/12 via-[color:var(--color-fd-muted)] to-[color:var(--color-fd-background)] p-6 shadow-inner">
        <div className="flex flex-col gap-6">
          <div className="space-y-2 pr-12">
            <div className="flex items-center gap-4 text-[var(--color-fd-primary)]">
              <span className="flex h-9 w-9 items-center justify-start rounded-full">
                <icons.Gift aria-hidden className="h-6 w-6" />
              </span>
              <div className="text-4xl font-semibold leading-tight text-[var(--color-fd-primary)]">
                {formatNumber(locale, data.totalBalance)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/40 bg-white/60 p-4 backdrop-blur -mx-2">
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-[color:var(--color-fd-foreground)]">
                  {subscription ? subscription.planName : translations.subscriptionInactive}
                </h4>
                {subscription ? (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-[color:var(--color-fd-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-fd-foreground)]">
                    {translations.subscriptionActive}
                  </span>
                ) : null}
              </div>
              <p className="min-h-[1.25rem] text-sm text-[color:var(--color-fd-muted-foreground)]">
                {subscription ? formatRange(locale, subscription) : translations.subscriptionPeriodLabel}
              </p>
              <div className="pt-2">
                <a
                  href={subscription ? subscription.manageUrl : data.subscribeUrl ?? '#'}
                  className={cn(
                    'inline-flex w-full items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    subscription
                      ? 'border-[var(--color-fd-primary)] text-[var(--color-fd-primary)] hover:bg-[color:var(--color-fd-muted)] focus-visible:ring-[color:var(--color-fd-primary)]'
                      : 'border-[var(--color-fd-primary)] bg-[var(--color-fd-primary)] text-[var(--color-fd-primary-foreground)] hover:opacity-90 focus-visible:ring-[color:var(--color-fd-primary)]',
                  )}
                >
                  {subscription ? translations.subscriptionManage : translations.subscribePay}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-6 -right-[14px]">
          <HoverInfo
            label={translations.totalLabel}
            description={translations.summaryDescription}
            Icon={InfoIcon}
          />
        </div>
      </header>

      {/* Credit Details Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-fd-foreground)]">
            {translations.bucketsTitle}
          </h3>
        </div>
        {hasBuckets ? (
          <ul className="flex flex-col gap-3">
            {buckets.map((bucket) => {
              const hasLimit = bucket.limit > 0;
              const limitDisplay = hasLimit ? formatNumber(locale, bucket.limit) : '—';
              const balanceDisplay = formatNumber(locale, bucket.balance);
              const ratioDisplay = hasLimit
                ? `${balanceDisplay}/${limitDisplay}`
                : balanceDisplay;
              return (
                <li
                  key={bucket.kind}
                  data-credit-kind={bucket.kind}
                  className="rounded-2xl border border-[color:var(--color-fd-border)]/60 bg-[color:var(--color-fd-muted)]/20 px-4 py-3"
                >
                  <div className="grid grid-cols-[minmax(0,_1.2fr)_110px_minmax(0,_0.8fr)] items-center gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 -ml-3">
                      <span className="max-w-[100%] truncate rounded-full bg-[color:var(--color-fd-popover)] px-3 py-1 text-xs font-semibold text-[color:var(--color-fd-foreground)]">
                        {bucket.computedLabel}
                      </span>
                      {bucket.description ? (
                        <HoverInfo
                          label={bucket.computedLabel}
                          description={bucket.description}
                          Icon={InfoIcon}
                          variant="muted"
                        />
                      ) : null}
                    </span>
                    <span className="flex h-full items-center justify-start">
                      {bucket.computedStatus ? (
                        <span
                          data-credit-status={bucket.computedStatus}
                          className={cn(
                            'inline-flex w-full items-center justify-center truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                            bucket.computedStatus === 'active' &&
                              'border-transparent bg-[color:var(--color-fd-muted)] text-[color:var(--color-fd-foreground)]',
                            bucket.computedStatus === 'expiringSoon' &&
                              'border-transparent bg-[color:var(--color-fd-accent)] text-[color:var(--color-fd-accent-foreground)]',
                            bucket.computedStatus === 'expired' &&
                              'border-[var(--color-fd-primary)] text-[var(--color-fd-primary)]',
                          )}
                          title={translations.bucketStatus[bucket.computedStatus]}
                        >
                          {translations.bucketStatus[bucket.computedStatus]}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex min-w-0 justify-end">
                      <span
                        className="max-w-[160px] truncate text-right text-sm font-semibold text-[color:var(--color-fd-foreground)]"
                        title={ratioDisplay}
                      >
                        {ratioDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-[color:var(--color-fd-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-fd-primary)] transition-all"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[color:var(--color-fd-muted-foreground)]">
                      {bucket.progress}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-muted)] bg-opacity-40 p-6 text-sm text-[color:var(--color-fd-muted-foreground)]">
            {translations.bucketsEmpty}
          </div>
        )}
      </section>

      {/* Action Buttons Section */}
      <footer className="flex flex-col gap-3">
        {/* Buy One-Time Credits Button - Always show */}
        <a
          href={data.checkoutUrl}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-fd-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-fd-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-fd-primary)]"
        >
          {translations.onetimeBuy}
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

interface HoverInfoProps {
  label?: string;
  description?: string;
  Icon: ComponentType<{ className?: string }>;
  variant?: 'default' | 'muted';
}

function HoverInfo({ label, description, Icon, variant = 'default' }: HoverInfoProps) {
  if (!description) {
    return null;
  }

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label ? `${label}: ${description}` : description}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-fd-primary)]',
          variant === 'muted'
            ? 'border-transparent bg-[color:var(--color-fd-muted)] text-[color:var(--color-fd-muted-foreground)] group-hover:text-[color:var(--color-fd-foreground)]'
            : 'border-transparent bg-[color:var(--color-fd-popover)] text-[color:var(--color-fd-muted-foreground)] group-hover:text-[color:var(--color-fd-foreground)]',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-full z-50 mt-3 w-max max-w-[260px] translate-x-4 rounded-xl border border-[color:var(--color-fd-border)] bg-[color:var(--color-fd-popover)] px-3 py-2 text-xs leading-relaxed text-[color:var(--color-fd-foreground)] opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-150 ease-out group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100"
      >
        {label ? (
          <span className="block text-[color:var(--color-fd-muted-foreground)]">{label}</span>
        ) : null}
        <span className="mt-1 block text-[color:var(--color-fd-foreground)]">
          {description}
        </span>
      </span>
    </span>
  );
}
