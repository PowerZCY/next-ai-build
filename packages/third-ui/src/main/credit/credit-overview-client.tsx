'use client';

import { useClerk } from '@clerk/nextjs';
import { GradientButton } from '@third-ui/fuma/mdx/gradient-button';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@windrun-huaiin/base-ui/ui';
import { cn } from '@windrun-huaiin/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CreditBucket,
  CreditBucketStatus,
  CreditOverviewData,
  SubscriptionInfo,
} from './types';
import { MoneyPriceInteractive } from '../money-price/money-price-interactive';
import { redirectToCustomerPortal } from '../money-price/customer-portal';

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

type PricingModalMode = 'subscription' | 'onetime';

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
  const { redirectToSignIn } = useClerk();
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
  const [pricingModal, setPricingModal] = useState<{
    open: boolean;
    mode: PricingModalMode;
  }>({
    open: false,
    mode: 'subscription',
  });
  const pricingContentRef = useRef<HTMLDivElement | null>(null);

  const modalMoneyPriceData = useMemo(() => {
    if (!pricingContext) {
      return null;
    }

    if (pricingModal.mode !== 'onetime') {
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
  }, [pricingContext, pricingModal.mode]);

  useEffect(() => {
    if (!pricingModal.open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!pricingContentRef.current) {
        return;
      }

      const target = event.target as Node | null;
      if (target && !pricingContentRef.current.contains(target)) {
        setPricingModal((prev) => ({
          ...prev,
          open: false,
        }));
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [pricingModal.open]);

  const openPricingModal = useCallback(
    (mode: PricingModalMode) => {
      if (!pricingContext) {
        return false;
      }
      setPricingModal({ open: true, mode });
      return true;
    },
    [pricingContext],
  );

  const handleSubscribeAction = useCallback(() => {
    if (subscription) {
      return;
    }

    if (openPricingModal('subscription')) {
      return;
    }

    if (data.subscribeUrl && data.subscribeUrl !== '#') {
      window.location.href = data.subscribeUrl;
    }
  }, [data.subscribeUrl, openPricingModal, subscription]);

  const handleManageAction = useCallback(async () => {
    if (!subscription) {
      return;
    }

    if (pricingContext) {
      const handled = await redirectToCustomerPortal({
        customerPortalApiEndpoint: pricingContext.customerPortalApiEndpoint,
        signInPath: pricingContext.signInPath,
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

    openPricingModal('subscription');
  }, [openPricingModal, pricingContext, redirectToSignIn, subscription]);

  const handleOnetimeAction = useCallback(() => {
    if (openPricingModal('onetime')) {
      return;
    }

    if (data.checkoutUrl && data.checkoutUrl !== '#') {
      window.location.href = data.checkoutUrl;
    }
  }, [data.checkoutUrl, openPricingModal]);

  return (
    <section
      className={cn(
        "flex min-h-[calc(100vh-110px)] flex-col gap-6 rounded-2xl border border-white bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950",
        className
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-bl from-indigo-200/60 via-indigo-400/90 to-purple-200/50 dark:from-indigo-300/20 dark:via-slate-400 dark:to-slate-500/50 p-4 shadow-inner">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-start rounded-full ">
            <icons.Gem aria-hidden className="h-8 w-8 mr-2" />
            <span>{translations.totalLabel}</span>
          </div>
          <div className="flex justify-center text-4xl font-semibold leading-tight">
            {formatNumber(locale, data.totalBalance)}
          </div>
          <div className="flex-1 flex-col gap-1">
            <p className="text-sm text-gray-700 dark:text-slate-100">
              {translations.subscriptionPeriodLabel}
            </p>
            <h4 className="text-2xl font-semibold">
              {subscription ? subscription.planName : translations.subscriptionInactive}
            </h4>
          </div>
          <div className="pt-0">
            <GradientButton
              title={subscription ? translations.subscriptionManage : translations.subscribePay}
              align="center"
              icon={subscription ? <icons.Settings2 /> : <icons.Bell />}
              openInNewTab={false}
              className="w-full"
              onClick={
                subscription
                  ? handleManageAction
                  : pricingContext
                    ? handleSubscribeAction
                    : undefined
              }
              href={
                subscription
                  ? subscription.manageUrl
                  : pricingContext
                    ? undefined
                    : data.subscribeUrl ?? '#'
              }
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
          href={pricingContext ? undefined : data.checkoutUrl}
          icon={<icons.ShoppingCart />}
          align="center"
          className="w-full"
          onClick={pricingContext ? handleOnetimeAction : undefined}
        />
      </section>
      {pricingContext ? (
        <AlertDialog
          open={pricingModal.open}
          onOpenChange={(open) =>
            setPricingModal((prev) => ({
              ...prev,
              open,
            }))
          }
        >
          <AlertDialogContent
            ref={pricingContentRef}
            className="mt-8 w-[95vw] max-w-[1200px] overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_32px_90px_rgba(15,23,42,0.25)] ring-1 ring-black/5 dark:border-white/12 dark:bg-[#0f1222] dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)] dark:ring-white/10"
          >
            <AlertDialogHeader className="flex flex-row items-center justify-between border-b border-slate-200 px-6 pt-4 pb-1 dark:border-slate-800">
              <AlertDialogTitle asChild>
                <div className="flex flex-wrap items-baseline gap-3 text-slate-900 dark:text-white">
                  <span className="text-2xl font-semibold leading-tight">
                    {modalMoneyPriceData?.title}
                  </span>
                  {modalMoneyPriceData?.subtitle ? (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                      {modalMoneyPriceData.subtitle}
                    </span>
                  ) : null}
                </div>
              </AlertDialogTitle>
              <button
                type="button"
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-400 hover:text-gray-400 dark:text-white/80 dark:hover:bg-white/80 dark:hover:text-white/80"
                onClick={() =>
                  setPricingModal((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
              >
                <icons.X className="h-6 w-6" />
              </button>
            </AlertDialogHeader>
            <div className="max-h-[80vh] overflow-y-auto px-4 pt-2 pb-6">
              <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 md:px-8">
                {modalMoneyPriceData ? (
                  <MoneyPriceInteractive
                    key={pricingModal.mode}
                    data={modalMoneyPriceData}
                    config={pricingContext.moneyPriceConfig}
                    checkoutApiEndpoint={pricingContext.checkoutApiEndpoint}
                    customerPortalApiEndpoint={pricingContext.customerPortalApiEndpoint}
                    signInPath={pricingContext.signInPath}
                    enableSubscriptionUpgrade={pricingContext.enableSubscriptionUpgrade}
                  />
                ) : null}
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
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
