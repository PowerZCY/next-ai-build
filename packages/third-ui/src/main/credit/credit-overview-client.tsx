'use client';

import { useMemo, type ComponentType } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { GradientButton } from '@third-ui/fuma/mdx/gradient-button';
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
  const InfoIcon = ( icons.CircleQuestionMark ) as ComponentType<{ className?: string }>;

  return (
    <section
      className={cn(
        'flex min-h-[calc(100vh-100px)] flex-col gap-6 rounded-2xl border border-white bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950',
        className,
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-br from-indigo-100/80 via-white to-white p-6 shadow-inner dark:from-indigo-500/20 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-6">
          <div className="space-y-3 pr-14">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full ">
                <icons.Gift aria-hidden className="h-6 w-6" />
              </span>
              <div className="text-4xl font-semibold leading-tight">
                {formatNumber(locale, data.totalBalance)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-500 dark:text-slate-100">
                  {subscription ? subscription.planName : translations.subscriptionInactive}
                </h4>
                {subscription ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-200">
                    {translations.subscriptionActive}
                  </span>
                ) : null}
              </div>
              <p className="min-h-[1.25rem] text-sm text-gray-500 dark:text-slate-100">
                {subscription ? formatRange(locale, subscription) : translations.subscriptionPeriodLabel}
              </p>
              <div className="pt-1">
                <GradientButton
                  title={subscription ? translations.subscriptionManage : translations.subscribePay}
                  href={subscription ? subscription.manageUrl : data.subscribeUrl ?? '#'}
                  align="center"
                  icon={<icons.Gift/>}
                  openInNewTab={false}
                  className='w-full px-6 py-3 text-sm font-semibold'
                />
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
          <h3 className="text-lg font-semibold text-gray-500 dark:text-slate-100">
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
                  className="rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60"
                >
                  <div className="grid grid-cols-[minmax(0,_1.2fr)_112px_minmax(0,_0.8fr)] items-center gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="max-w-full truncate rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 shadow-sm dark:bg-purple-500/20 dark:text-purple-100">
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
                            'inline-flex w-full items-center justify-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm transition-colors',
                            bucket.computedStatus === 'active' &&
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
                            bucket.computedStatus === 'expiringSoon' &&
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
                            bucket.computedStatus === 'expired' &&
                              'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
                          )}
                          title={translations.bucketStatus[bucket.computedStatus]}
                        >
                          {translations.bucketStatus[bucket.computedStatus]}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex min-w-0 justify-end">
                      <span
                        className="max-w-[160px] truncate text-right text-sm font-semibold text-gray-500 dark:text-slate-100"
                        title={ratioDisplay}
                      >
                        {ratioDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all dark:from-purple-400 dark:to-indigo-400"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-100">
                      {bucket.progress}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/70 p-6 text-sm text-gray-500 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-100">
            {translations.bucketsEmpty}
          </div>
        )}
      </section>

      {/* Action Buttons Section */}
      <footer className="flex flex-col gap-3">
        <GradientButton
          title={translations.onetimeBuy}
          href={data.checkoutUrl}
          icon={<icons.Gift/>}
          align="center"
          className="w-full rounded-full text-sm font-semibold"
        />
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
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
          variant === 'muted'
            ? 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:text-slate-100'
            : 'border-white/70 bg-white text-purple-600 shadow-sm hover:text-purple-700 dark:border-purple-500/50 dark:bg-slate-900/80 dark:text-purple-200 dark:hover:text-purple-100',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-full z-50 mt-3 w-max max-w-[260px] translate-x-4 rounded-xl border border-slate-200/70 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl ring-1 ring-black/30 transition-all duration-150 ease-out group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100 dark:border-slate-700/60 dark:bg-slate-800/95"
      >
        {label ? (
          <span className="block text-slate-200 dark:text-slate-100">{label}</span>
        ) : null}
        <span className="mt-1 block text-white dark:text-slate-100">
          {description}
        </span>
      </span>
    </span>
  );
}
