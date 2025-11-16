'use client';

import { useClerk } from '@clerk/nextjs';
import { GradientButton } from '@third-ui/fuma/mdx/gradient-button';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { useCallback, useMemo } from 'react';
import { redirectToCustomerPortal } from '../money-price/customer-portal';
import type {
  CreditBucket,
  CreditBucketStatus,
  CreditOverviewData
} from './types';
import { useCreditNavPopover, type PricingModalMode } from './credit-nav-button';

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


export function CreditOverviewClient({
  data,
  locale,
  translations,
  className,
  expiringSoonThresholdDays = 7,
}: CreditOverviewClientProps) {
  const { redirectToSignIn } = useClerk();
  const navPopover = useCreditNavPopover();
  const closeNavPopover = useCallback(
    (options?: { defer?: boolean }) => {
      if (!navPopover) {
        return;
      }
      if (options?.defer) {
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => navPopover.close());
        } else {
          setTimeout(() => navPopover.close(), 0);
        }
        return;
      }
      navPopover.close();
    },
    [navPopover],
  );
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
  const pricingContext = data.pricingContext;
  const getModalMoneyPriceData = useCallback(
    (mode: PricingModalMode) => {
      if (!pricingContext) {
        return null;
      }

      if (mode !== 'onetime') {
        return pricingContext.moneyPriceData;
      }

      const hasOnetimeOption = pricingContext.moneyPriceData.billingSwitch.options.some(
        (option) => option.key === 'onetime',
      );

      if (!hasOnetimeOption) {
        return pricingContext.moneyPriceData;
      }

      return {
        ...pricingContext.moneyPriceData,
        billingSwitch: {
          ...pricingContext.moneyPriceData.billingSwitch,
          defaultKey: 'onetime',
        },
      };
    },
    [pricingContext],
  );

  const requestPricingModal = useCallback(
    (mode: PricingModalMode) => {
      if (!pricingContext || !navPopover?.openPricingModal) {
        return false;
      }
      const dataForMode = getModalMoneyPriceData(mode);
      if (!dataForMode) {
        return false;
      }

      navPopover.openPricingModal({
        mode,
        modalMoneyPriceData: dataForMode,
        pricingContext,
      });
      return true;
    },
    [getModalMoneyPriceData, navPopover, pricingContext],
  );

  const handleSubscribeAction = useCallback(() => {
    if (subscription) {
      return;
    }

    const opened = requestPricingModal('subscription');
    if (opened) {
      closeNavPopover({ defer: true });
      return;
    }

    closeNavPopover();
    if (data.subscribeUrl && data.subscribeUrl !== '#') {
      window.location.href = data.subscribeUrl;
    }
  }, [closeNavPopover, data.subscribeUrl, requestPricingModal, subscription]);

  const handleManageAction = useCallback(async () => {
    if (!subscription) {
      return;
    }

    closeNavPopover();

    if (pricingContext) {
      const handled = await redirectToCustomerPortal({
        customerPortalApiEndpoint: pricingContext.customerPortalApiEndpoint,
        redirectToSignIn,
      });
      if (handled) {
        return;
      }
    }

    if (subscription.manageUrl && subscription.manageUrl !== '#') {
      window.location.href = subscription.manageUrl;
      return;
    }

    requestPricingModal('subscription');
  }, [closeNavPopover, pricingContext, redirectToSignIn, requestPricingModal, subscription]);

  const handleOnetimeAction = useCallback(() => {
    const opened = requestPricingModal('onetime');
    if (opened) {
      closeNavPopover({ defer: true });
      return;
    }

    closeNavPopover();
    if (data.checkoutUrl && data.checkoutUrl !== '#') {
      window.location.href = data.checkoutUrl;
    }
  }, [closeNavPopover, data.checkoutUrl, requestPricingModal]);

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:gap-6 sm:p-6",
        className
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-bl from-indigo-200/60 via-indigo-400/90 to-purple-200/50 p-4 shadow-inner dark:from-indigo-300/20 dark:via-slate-400 dark:to-slate-500/50 sm:p-6">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-start rounded-full ">
            <icons.Gem aria-hidden className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-sm font-medium sm:text-base">{translations.totalLabel}</span>
          </div>
          <div className="flex justify-center text-3xl font-semibold leading-tight sm:text-4xl">
            {formatNumber(locale, data.totalBalance)}
          </div>
          <div className="flex-1 flex-col gap-1">
            <p className="text-xs text-gray-700 dark:text-slate-100 sm:text-sm">
              {translations.subscriptionPeriodLabel}
            </p>
            <h4 className="text-xl font-semibold sm:text-2xl">
              {subscription ? subscription.planName : translations.subscriptionInactive}
            </h4>
          </div>
          <div className="pt-2 sm:pt-0">
            <GradientButton
              title={subscription ? translations.subscriptionManage : translations.subscribePay}
              align="center"
              icon={subscription ? <icons.Settings2 /> : <icons.Bell />}
              openInNewTab={false}
              className="w-full"
              onClick={subscription ? handleManageAction : handleSubscribeAction}
            />
          </div>
        </div>
        <div className="absolute right-3 top-3 sm:-right-[14px] sm:top-6">
          <HoverInfo
            label={translations.totalLabel}
            description={translations.summaryDescription}
          />
        </div>
      </header>

      {/* Credit Details Section */}
      <section className="relative space-y-3 rounded-2xl border p-4 shadow-inner sm:space-y-2 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-500 dark:text-slate-100 sm:text-lg">
            {translations.bucketsTitle}
          </h3>
        </div>
        {hasBuckets ? (
          <ul className="mb-4 flex flex-col gap-3 sm:mb-5">
            {buckets.map((bucket) => {
              const balanceDisplay = formatNumber(locale, bucket.balance);
              return (
                <li
                  key={bucket.kind}
                  data-credit-kind={bucket.kind}
                  className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60 sm:px-4"
                >
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs sm:text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="max-w-full truncate rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 shadow-sm dark:bg-purple-500/20 dark:text-purple-100 sm:text-sm">
                        {bucket.computedLabel}
                      </span>
                    </span>
                    <span className="flex min-w-0 justify-end">
                      <span
                        className="text-right text-base font-semibold leading-tight text-gray-500 dark:text-slate-100 sm:text-lg"
                        title={balanceDisplay}
                      >
                        {balanceDisplay}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-100 sm:text-xs">
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
          icon={<icons.ShoppingCart />}
          align="center"
          className="w-full text-sm sm:text-base"
          onClick={handleOnetimeAction}
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
