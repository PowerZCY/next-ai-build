'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useFingerprint } from './use-fingerprint';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { cn, viewLocalTime } from '@windrun-huaiin/lib/utils';
import type { 
  FingerprintContextType, 
  FingerprintProviderProps 
} from './types';

const FingerprintContext = createContext<FingerprintContextType | undefined>(undefined);

/**
 * Fingerprint Provider Component
 * 为应用提供fingerprint和匿名用户管理功能
 */
export function FingerprintProvider({ 
  children,
  config
}: FingerprintProviderProps) {
  const fingerprintData = useFingerprint(config);

  return (
    <FingerprintContext.Provider value={fingerprintData}>
      {children}
    </FingerprintContext.Provider>
  );
}

/**
 * Hook to use fingerprint context
 */
export function useFingerprintContext(): FingerprintContextType {
  const context = useContext(FingerprintContext);
  if (context === undefined) {
    throw new Error('useFingerprintContext must be used within a FingerprintProvider');
  }
  return context;
}

/**
 * Safe hook to use fingerprint context - returns null if no provider
 * 安全版本的fingerprint context hook - 如果没有Provider则返回null
 */
export function useFingerprintContextSafe(): FingerprintContextType | null {
  const context = useContext(FingerprintContext);
  return context || null;
}

/**
 * HOC for components that need fingerprint functionality
 * Note: This HOC now requires config to be passed externally
 */
export function withFingerprint<P extends object>(
  Component: React.ComponentType<P>,
  config: FingerprintProviderProps['config']
) {
  return function FingerprintWrappedComponent(props: P) {
    return (
      <FingerprintProvider config={config}>
        <Component {...props} />
      </FingerprintProvider>
    );
  };
}

/**
 * 组件：显示用户状态和积分信息（用于调试）
 */
export function FingerprintStatus() {
  const { 
    fingerprintId, 
    xUser, 
    xCredit, 
    xSubscription,
    error 
  } = useFingerprintContext();

  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // 确保 xUser 更新后才渲染内容
  useEffect(() => {
    if (xUser && !xUser.fingerprintId) {
      console.warn('xUser.fingerprintId is missing:', xUser);
    }
  }, [xUser]);

  useEffect(() => {
    if (xUser || xCredit || xSubscription) {
      setUpdatedAt(viewLocalTime(new Date()));
    }
  }, [xUser, xCredit, xSubscription]);

  const creditBuckets = useMemo(() => {
    if (!xCredit) return [];
    return [
      {
        key: 'paid',
        label: '订阅积分',
        icon: <icons.Settings2 className="size-4 text-indigo-500 dark:text-indigo-300" />,
        balance: xCredit.balancePaid,
        total: xCredit.totalPaidLimit,
        start: xCredit.paidStart,
        end: xCredit.paidEnd,
      },
      {
        key: 'oneTimePaid',
        label: '一次性积分',
        icon: <icons.Coins className="size-4 text-amber-500 dark:text-amber-300" />,
        balance: xCredit.balanceOneTimePaid,
        total: xCredit.totalOneTimePaidLimit,
        start: xCredit.oneTimePaidStart,
        end: xCredit.oneTimePaidEnd,
      },
      {
        key: 'free',
        label: '免费积分',
        icon: <icons.Gift className="size-4 text-purple-500 dark:text-purple-300" />,
        balance: xCredit.balanceFree,
        total: xCredit.totalFreeLimit,
        start: xCredit.freeStart,
        end: xCredit.freeEnd,
      },
    ];
  }, [xCredit]);

  const subscriptionStatus = useMemo(() => {
    if (!xSubscription) {
      return {
        status: '未订阅',
        priceName: '--',
        creditsAllocated: '--',
        period: '无记录',
      };
    }

    return {
      status: xSubscription.status ?? '--',
      priceName: xSubscription.priceName ?? '--',
      creditsAllocated: typeof xSubscription.creditsAllocated === 'number'
        ? formatNumber(xSubscription.creditsAllocated)
        : '--',
      period: formatRangeText(xSubscription.subPeriodStart, xSubscription.subPeriodEnd),
    };
  }, [xSubscription]);

  return (
    <>
      <button
        onClick={handleToggle}
        type="button"
        aria-expanded={isOpen}
        aria-label="切换 Fingerprint 调试面板"
        className={cn(
          'fixed left-6 top-6 z-[10000] inline-flex size-11 items-center justify-center rounded-full border border-white/40',
          'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-400 text-white shadow-lg transition-all duration-300',
          'hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 dark:border-white/10',
          'dark:from-purple-500 dark:via-pink-500 dark:to-rose-500'
        )}
      >
        <icons.BTC
          className={cn(
            'size-5 transition-transform duration-300',
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />
          <div
            ref={modalRef}
            className={cn(
              'fixed left-6 top-10 z-[9999] w-[min(500px,90vw)] max-h-[80vh] overflow-y-auto rounded-2xl border',
              'border-slate-200/70 bg-white/95 p-5 shadow-2xl backdrop-blur-sm',
              'font-sans text-sm text-slate-700',
              'dark:border-white/12 dark:bg-slate-950/95 dark:text-slate-200'
            )}
          >
            <header className="mb-5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <icons.ShieldUser className="size-4" />
                Fingerprint Debug Panel
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                数据更新：{updatedAt || '等待加载'}
              </span>
            </header>

            <section className="space-y-3">
              <PanelSection
                icon={<icons.Fingerprint className="size-4" />}
                title="用户信息"
                items={[
                  { label: '用户 ID', value: xUser?.userId || '--' },
                  { label: 'Fingerprint ID', value: xUser?.fingerprintId || fingerprintId || '--' },
                  { label: '状态', value: xUser?.status || '--' },
                  { label: 'Clerk 用户', value: xUser?.clerkUserId || '--' },
                  { label: '邮箱', value: xUser?.email || '--' },
                  { label: 'Stripe 客户', value: xUser?.stripeCusId || '--' },
                  { label: '创建时间', value: xUser?.createdAt || '--' },
                ]}
              />
              <div className="space-y-2 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                    <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <icons.Gem className="size-4" />
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-100">
                      积分信息
                    </span>
                    <span>{formatNumber(xCredit?.totalBalance)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {creditBuckets.length > 0 ? (
                    creditBuckets.map((bucket) => {
                      const percentRaw = computeProgress(bucket.balance, bucket.total);
                      const percent = Math.round(percentRaw * 100);
                      return (
                        <div key={bucket.key} className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/40">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              {bucket.icon}
                              <span>{bucket.label}</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-100">
                              {formatNumber(bucket.balance)} / {formatNumber(bucket.total)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 transition-[width]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{formatRangeText(bucket.start, bucket.end)}</span>
                            <span>{percent}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyPlaceholder label="暂无积分数据" icon={<icons.DatabaseZap className="size-4" />} />
                  )}
                </div>
              </div>

              <PanelSection
                icon={<icons.Bell className="size-4" />}
                title="订阅信息"
                items={[
                  { label: '订阅方案', value: subscriptionStatus.priceName },
                  { label: '订阅状态', value: subscriptionStatus.status },
                  { label: '有效期', value: subscriptionStatus.period },
                  { label: '分配额度', value: subscriptionStatus.creditsAllocated },
                  { label: '订阅 ID', value: xSubscription?.paySubscriptionId || '--' },
                  { label: 'Order ID', value: xSubscription?.orderId || '--' },
                  { label: 'Price ID', value: xSubscription?.priceId || '--' },
                ]}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <icons.X className="mt-0.5 size-4" />
                  <span>{error}</span>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

interface PanelSectionProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{ label: string; value: React.ReactNode }>;
}

function PanelSection({ icon, title, items }: PanelSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/45">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </span>
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-100">
          {title}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-y-1.5 text-xs text-slate-500 dark:text-slate-300">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <dt className="text-slate-400 dark:text-slate-500">{item.label}</dt>
            <dd className="text-right font-medium text-slate-600 dark:text-slate-100">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EmptyPlaceholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6 text-xs text-slate-400 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function computeProgress(balance: number | null | undefined, total: number | null | undefined) {
  if (typeof balance !== 'number' || typeof total !== 'number' || Number.isNaN(balance) || Number.isNaN(total) || total <= 0) {
    return 0;
  }
  const ratio = balance / total;
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(Math.max(ratio, 0), 1);
}

function formatRangeText(start: string | null | undefined, end: string | null | undefined) {
  const safeStart = start && start.trim() ? start : '';
  const safeEnd = end && end.trim() ? end : '';

  if (!safeStart && !safeEnd) {
    return '无记录';
  }

  if (!safeStart) {
    return safeEnd;
  }

  if (!safeEnd) {
    return safeStart;
  }

  return `${safeStart} - ${safeEnd}`;
}
