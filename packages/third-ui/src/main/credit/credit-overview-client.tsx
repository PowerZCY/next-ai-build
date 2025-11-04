'use client';

import { GradientButton } from '@third-ui/fuma/mdx/gradient-button';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { useMemo } from 'react';
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
  bucketDefaultLabels: Record<string, string>;
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

  return (
    <section
      className={cn(
        "flex min-h-[calc(100vh-110px)] flex-col gap-6 rounded-2xl border border-white bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950",
        className
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-bl from-white via-indigo-400/90 to-purple-100/40 p-4 shadow-inner dark:from-indigo-300/20 dark:via-slate-400 dark:to-slate-500/50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-start rounded-full ">
            <icons.Gem aria-hidden className="h-8 w-8 mr-2" />
            <span>{translations.totalLabel}</span>
          </div>
          <div className="flex justify-center text-4xl font-semibold leading-tight">
            {formatNumber(locale, data.totalBalance)}
          </div>
          <div className="flex-1 flex-col gap-1">
            <p className="text-sm text-gray-500 dark:text-slate-100">
              {translations.subscriptionPeriodLabel}
            </p>
            <h4 className="text-2xl font-semibold">
              {subscription ? subscription.planName : translations.subscriptionInactive}
            </h4>
          </div>
          <div className="pt-0">
            <GradientButton
              title={ subscription ? translations.subscriptionManage : translations.subscribePay }
              href={ subscription ? subscription.manageUrl : data.subscribeUrl ?? "#" }
              align="center"
              icon={subscription ? <icons.Settings2/> : <icons.Bell/>}
              openInNewTab={false}
              className="w-full rounded-full text-sm font-semibold"
            />
          </div>
        </div>
        <div className="absolute top-6 -right-[14px]">
          <HoverInfo
            label={translations.totalLabel}
            description={translations.summaryDescription}
          />
        </div>
      </header>

      {/* Credit Details Section */}
      <section className="space-y-2 relative rounded-2xl border p-4 shadow-inner">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-500 dark:text-slate-100">
            {translations.bucketsTitle}
          </h3>
        </div>
        {hasBuckets ? (
          <ul className="flex flex-col gap-3 mb-5">
            {buckets.map((bucket) => {
              const balanceDisplay = formatNumber(locale, bucket.balance);
              return (
                <li
                  key={bucket.kind}
                  data-credit-kind={bucket.kind}
                  className="rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60"
                >
                  <div className="grid grid-cols-2 items-center gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="max-w-full truncate rounded-full bg-purple-50 px-2 py-1 text-sm font-semibold text-purple-600 shadow-sm dark:bg-purple-500/20 dark:text-purple-100">
                        {bucket.computedLabel}
                      </span>
                    </span>
                    <span className="flex min-w-0 justify-end">
                      <span
                        className="text-right text-lg font-semibold leading-tight text-gray-500 dark:text-slate-100"
                        title={balanceDisplay}
                      >
                        {balanceDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-100">
                      Expires: {bucket.expiresAt}
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
        <GradientButton
          title={translations.onetimeBuy}
          href={data.checkoutUrl}
          icon={<icons.ShoppingCart />}
          align="center"
          className="w-full rounded-full text-sm font-semibold"
        />
      </section>
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
  variant?: 'default' | 'muted';
}

function HoverInfo({ description, variant = 'default' }: HoverInfoProps) {
  if (!description) {
    return null;
  }

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={description}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
          variant === 'muted'
            ? 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:text-slate-100'
            : 'border-transparent bg-white text-purple-600 shadow-[0_6px_20px_rgba(99,102,241,0.25)] hover:text-purple-700 dark:bg-[#1b1541] dark:text-purple-100 dark:hover:text-purple-50 dark:shadow-[0_6px_22px_rgba(112,86,255,0.35)]',
        )}
      >
        <icons.CircleQuestionMark className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-full z-50 mt-3 w-max max-w-[260px] translate-x-4 rounded-xl border border-slate-200/70 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl ring-1 ring-black/30 transition-all duration-150 ease-out group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100 dark:border-slate-700/60 dark:bg-slate-800/95"
      >
        <span className="mt-1 block text-white dark:text-slate-100">
          {description}
        </span>
      </span>
    </span>
  );
}
