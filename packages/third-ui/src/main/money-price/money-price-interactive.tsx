'use client';

import { useClerk } from '@clerk/nextjs';
import { useFingerprintContextSafe } from '@third-ui/clerk/fingerprint';
import { cn } from '@windrun-huaiin/lib/utils';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { MoneyPriceButton } from './money-price-button';
import { getActiveProviderConfigUtil, getProductPricing } from './money-price-config-util';
import {
  UserState,
  type MoneyPriceInteractiveProps,
  type UserContext
} from './money-price-types';
import { redirectToCustomerPortal } from './customer-portal';

type BillingType = string;

interface BillingOption {
  key: string;
  name: string;
  unit: string;
  discountText: string;
  subTitle?: string;
}

const PLAN_KEYS: Array<'F1' | 'P2' | 'U3'> = ['F1', 'P2', 'U3'];

export function MoneyPriceInteractive({
  data,
  config,
  checkoutApiEndpoint,
  customerPortalApiEndpoint,
  enableClerkModal = false,
  enabledBillingTypes,
  enableSubscriptionUpgrade = true,
}: MoneyPriceInteractiveProps) {
  const fingerprintContext = useFingerprintContextSafe();
  const { redirectToSignIn, redirectToSignUp, user: clerkUser, openSignIn, openSignUp } = useClerk();
  const router = useRouter();

  const providerConfig = useMemo(() => getActiveProviderConfigUtil(config), [config]);
  const billingOptions = useMemo(() => {
    const options = data.billingSwitch.options as BillingOption[];

    // 如果配置了 enabledBillingTypes，只显示配置的类型
    if (enabledBillingTypes?.length) {
      return options.filter(option => enabledBillingTypes.includes(option.key));
    }

    // 否则显示所有配置的选项
    return options;
  }, [data.billingSwitch.options, enabledBillingTypes]);
  const billingOptionMap = useMemo(() => {
    return billingOptions.reduce<Record<string, BillingOption>>((acc, option) => {
      acc[option.key] = option;
      return acc;
    }, {});
  }, [billingOptions]);
  const defaultBilling = useMemo<BillingType>(() => {
    const defaultKey = data.billingSwitch.defaultKey;

    // 如果默认值在可用选项中，使用默认值
    if (billingOptions.some(opt => opt.key === defaultKey)) {
      return defaultKey;
    }

    // 否则使用第一个可用选项
    return billingOptions[0]?.key || 'monthly';
  }, [data.billingSwitch.defaultKey, billingOptions]);

  const priceIdsByCycle = useMemo(() => {
    const priceIds: Record<string, string[]> = {};

    // 为每个可用的计费类型创建价格ID数组
    billingOptions.forEach(option => {
      priceIds[option.key] = [];

      if (option.key === 'onetime') {
        // 处理积分包产品
        const creditPacks = providerConfig.creditPackProducts || {};
        Object.values(creditPacks).forEach((pack: any) => {
          priceIds[option.key].push(pack.priceId);
        });
      } else {
        // 处理订阅产品
        const products = providerConfig.subscriptionProducts || providerConfig.products || {};
        PLAN_KEYS.forEach(planKey => {
          const product = (products as any)[planKey];
          if (product && product.plans && product.plans[option.key]) {
            priceIds[option.key].push(product.plans[option.key].priceId);
          }
        });
      }
    });

    return priceIds;
  }, [providerConfig, billingOptions]);

  const isClerkAuthenticated = !!clerkUser?.id;

  const detectBillingType = useCallback((): BillingType | null => {
    if (!isClerkAuthenticated) return null;
    if (fingerprintContext?.xSubscription?.status !== 'active') return null;
    const priceId = fingerprintContext.xSubscription?.priceId;
    if (!priceId) return null;

    // 动态检测匹配的计费类型
    for (const [cycle, priceIds] of Object.entries(priceIdsByCycle)) {
      if (priceIds.includes(priceId)) {
        return cycle;
      }
    }
    return null;
  }, [fingerprintContext, priceIdsByCycle, isClerkAuthenticated]);

  const [billingType, setBillingType] = useState<BillingType>(defaultBilling);
  const contextSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const priceId = fingerprintContext?.xSubscription?.priceId ?? '';
    const signature = `${isClerkAuthenticated ? '1' : '0'}:${priceId}`;
    if (contextSignatureRef.current !== signature) {
      contextSignatureRef.current = signature;
      const detected = detectBillingType();
      const nextBilling = detected ?? defaultBilling;
      setBillingType(prev => (prev === nextBilling ? prev : nextBilling));
    }
  }, [
    detectBillingType,
    fingerprintContext?.xSubscription?.priceId,
    defaultBilling,
    isClerkAuthenticated
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  const getUserState = useCallback((): UserState => {
    if (!fingerprintContext) return UserState.Anonymous;
    const { xUser, xSubscription } = fingerprintContext;

    if (!xUser?.clerkUserId) return UserState.Anonymous;
    if (!xSubscription?.status || xSubscription.status !== 'active') return UserState.FreeUser;

    const userPriceId = xSubscription.priceId;
    if (!userPriceId) return UserState.FreeUser;

    // 获取订阅产品配置
    const products = providerConfig.subscriptionProducts || providerConfig.products || {};

    const proPlans = (products as any).P2?.plans || {};
    const proIds = Object.values(proPlans).map((plan: any) => plan.priceId);
    if (proIds.includes(userPriceId)) {
      return UserState.ProUser;
    }

    const ultraPlans = (products as any).U3?.plans || {};
    const ultraIds = Object.values(ultraPlans).map((plan: any) => plan.priceId);
    if (ultraIds.includes(userPriceId)) {
      return UserState.UltraUser;
    }

    return UserState.FreeUser;
  }, [fingerprintContext, providerConfig]);

  const userContext = useMemo<UserContext>(() => {
    const isAuth = isClerkAuthenticated;
    const userState = getUserState();
    const detectedType = detectBillingType();

    return {
      isAuthenticated: isAuth,
      subscriptionStatus: isAuth ? userState : UserState.Anonymous,
      subscriptionType: detectedType ?? undefined,
      subscriptionEndDate: fingerprintContext?.xSubscription?.subPeriodEnd
    };
  }, [clerkUser, getUserState, detectBillingType, fingerprintContext]);

  const handleAuth = useCallback(() => {
    if (!fingerprintContext) {
      return;
    }
    const { fingerprintId, xUser } = fingerprintContext;
    const isRegistered = !!xUser?.clerkUserId;

    console.log('PriceButton auth DEBUG:', {
      enableClerkModal,
      fingerprintId,
      userId: xUser?.userId,
      clerkUserId: xUser?.clerkUserId,
      isRegistered
    });

    if (!enableClerkModal) {
      // 跳转处理
      isRegistered ? redirectToSignIn() : redirectToSignUp();
    }  else {
      // 弹窗处理
      const userId = xUser?.userId || null;
      const unsafeMetadata = {
        user_id: userId,
        fingerprint_id: fingerprintId || null,
      };
      isRegistered ? openSignIn({unsafeMetadata}) : openSignUp({unsafeMetadata});
    }
    return;
  }, [redirectToSignIn, redirectToSignUp, openSignIn, openSignUp]);

  const handleAction = useCallback(async (plan: string, billing: string) => {
    const isSubscriptionFlow = billing !== 'onetime';

    if (isSubscriptionFlow && !enableSubscriptionUpgrade) {
      return;
    }

    setIsProcessing(true);
    try {
      const hasActiveSubscription =
        userContext.isAuthenticated &&
        (userContext.subscriptionStatus === UserState.ProUser ||
          userContext.subscriptionStatus === UserState.UltraUser);

      const shouldUsePortal = isSubscriptionFlow && hasActiveSubscription;

      if (shouldUsePortal) {
        const handled = await redirectToCustomerPortal({
          customerPortalApiEndpoint,
          redirectToSignIn,
          returnUrl: window.location.href,
        });
        if (handled) {
          return;
        }
      }

      if (!checkoutApiEndpoint) {
        router.push('/');
        return;
      }

      const pricing = getProductPricing(
        plan as 'F1' | 'P2' | 'U3',
        billing as BillingType,
        config.activeProvider,
        config
      );

      const response = await fetch(checkoutApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pricing.priceId,
          plan,
          billingType: billing,
          provider: config.activeProvider
        })
      });

      if (response.redirected || response.status === 302 || response.status === 301) {
        window.location.href = response.url;
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response, user may need to login');
        redirectToSignIn();
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || `Request failed with status ${response.status}`;
        console.error('Upgrade request failed:', errorMessage);

        if (response.status === 401 || response.status === 403) {
          redirectToSignIn();
        } else {
          alert(`Operation failed: ${errorMessage}`);
        }
        return;
      }

      if (result.success && result.data?.sessionUrl) {
        window.location.href = result.data.sessionUrl;
      } else {
        console.error('Failed to create checkout session:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error during upgrade:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    customerPortalApiEndpoint,
    checkoutApiEndpoint,
    config,
    router,
    redirectToSignIn,
    userContext,
    enableSubscriptionUpgrade,
  ]);

  // 根据当前计费类型动态选择要显示的 plans
  const currentPlans = useMemo(() => {
    if (billingType === 'onetime') {
      return data.creditsPlans || [];
    }
    return data.subscriptionPlans || [];
  }, [billingType, data.subscriptionPlans, data.creditsPlans]);

  const maxFeaturesCount = useMemo(() => {
    const featureCounts = currentPlans.map(plan => plan.features?.length || 0);
    return Math.max(config.display.minFeaturesCount || 0, ...featureCounts);
  }, [currentPlans, config.display.minFeaturesCount]);

  const getFeatureRows = useCallback((plan: any) => {
    const features = plan.features || [];
    const filled = [...features];
    while (filled.length < maxFeaturesCount) filled.push(null);
    return filled;
  }, [maxFeaturesCount]);

  const getPricingForPlan = useCallback((planKey: 'F1' | 'P2' | 'U3') => {
    return getProductPricing(
      planKey,
      billingType,
      config.activeProvider,
      config
    );
  }, [billingType, config]);

  const selectedBillingOption = billingOptionMap[billingType];
  const discountBadgeText = useMemo(() => {
    if (!selectedBillingOption?.discountText) return null;

    // 对于 onetime 模式，直接显示 discountText，不依赖 discountPercent
    if (billingType === 'onetime') {
      return selectedBillingOption.discountText;
    }

    // 对于订阅模式，查找 discountPercent 并替换
    let discountPercent: number | null = null;
    const products = providerConfig.subscriptionProducts || providerConfig.products || {};

    PLAN_KEYS.forEach(planKey => {
      const product = (products as any)[planKey];
      if (product?.plans?.[billingType]?.discountPercent) {
        discountPercent = product.plans[billingType].discountPercent;
      }
    });

    if (!discountPercent) return null;
    return selectedBillingOption.discountText.replace('{percent}', String(discountPercent));
  }, [selectedBillingOption, providerConfig, billingType]);

  const handleTooltipShow = useCallback((content: string, event: React.MouseEvent) => {
    setTooltip({
      show: true,
      content,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const handleTooltipMove = useCallback((event: React.MouseEvent) => {
    setTooltip(prev => prev.show ? { ...prev, x: event.clientX, y: event.clientY } : prev);
  }, []);

  const handleTooltipHide = useCallback(() => {
    setTooltip(prev => ({ ...prev, show: false }));
  }, []);

  const Tooltip = ({ show, content, x, y }: typeof tooltip) => {
    if (!show) return null;
    const style: React.CSSProperties = {
      position: 'fixed',
      left: Math.max(8, x),
      top: Math.max(8, y),
      zIndex: 9999,
      maxWidth: 200,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      whiteSpace: 'pre-line',
    };
    return (
      <div
        style={style}
        className="bg-gray-700 dark:bg-gray-200 text-gray-100 dark:text-gray-800 text-xs leading-relaxed px-3 py-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 backdrop-blur-sm"
      >
        {content}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="flex items-center relative mb-3">
          <div className="flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full p-1" data-billing-switch>
            {billingOptions.map(option => {
              const isActive = option.key === billingType;
              const buttonClasses = isActive
                ? 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
                : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full';

              return (
                <button
                  key={option.key}
                  className={cn(
                    'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
                    buttonClasses
                  )}
                  type="button"
                  data-billing-button={option.key}
                  onClick={() => setBillingType(option.key as BillingType)}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-8 flex items-center justify-center mb-3" data-discount-info>
          {discountBadgeText ? (
            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap">
              {discountBadgeText}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {currentPlans.map((plan: any) => {
          const planKey = plan.key as 'F1' | 'P2' | 'U3';
          if (!PLAN_KEYS.includes(planKey)) {
            console.warn(`Unknown plan key "${plan.key}" detected in pricing plans`);
            return null;
          }
          const pricing = getPricingForPlan(planKey);

          const showBillingSubtitle = plan.showBillingSubTitle !== false;
          const hasDiscount = !!pricing.discountPercent && !!pricing.originalAmount;

          return (
            <div
              key={plan.key}
              data-price-plan={planKey}
              className={cn(
                'flex flex-col bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-300 dark:border-[#7c3aed40] transition p-8 h-full shadow-sm dark:shadow-none min-w-[350px]',
                'hover:border-2 hover:border-purple-500',
                'focus-within:border-2 focus-within:border-purple-500'
              )}
              style={{ minHeight: maxFeaturesCount * 100 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.title}</span>
                {plan.titleTags && plan.titleTags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold align-middle">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col items-start w-full" data-price-container={planKey}>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100" data-price-value={planKey}>
                    {pricing.amount === 0 ? 'Free' : `${data.currency}${pricing.amount}`}
                  </span>
                  {pricing.amount > 0 && (
                    <span className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-1" data-price-unit={planKey}>
                      {selectedBillingOption?.unit || '/month'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 min-h-[24px] mt-1">
                  {hasDiscount && (
                    <>
                      <span className="text-base text-gray-400 line-through" data-price-original={planKey}>
                        {data.currency}{pricing.originalAmount}
                      </span>
                      {selectedBillingOption?.discountText && (
                        <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle" data-price-discount={planKey}>
                          {selectedBillingOption.discountText.replace('{percent}', String(pricing.discountPercent))}
                        </span>
                      )}
                    </>
                  )}
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      !showBillingSubtitle && 'opacity-0 select-none'
                    )}
                    data-price-subtitle={planKey}
                  >
                    {showBillingSubtitle && billingType === 'onetime' ? (
                      // OneTime 模式下的特殊处理：普通文本 + 带样式的产品副标题
                      <>
                        {selectedBillingOption?.subTitle && (
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {selectedBillingOption.subTitle}
                          </span>
                        )}
                        {plan.subtitle && (
                          <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle">
                            +{plan.subtitle}
                          </span>
                        )}
                      </>
                    ) : (
                      // 其他模式下保持原逻辑
                      showBillingSubtitle && (
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {selectedBillingOption?.subTitle || ''}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <ul className="flex-1 mb-6 mt-4">
                {getFeatureRows(plan).map((feature: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 mb-2 min-h-[28px]" data-feature-item={`${planKey}-${i}`}>
                    {feature ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 mr-1">
                        {feature.icon ? <span>{feature.icon}</span> : <span className="font-bold">✓</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1">&nbsp;</span>
                    )}
                    {feature && feature.tag && (
                      <span className="px-1 py-0.5 text-[6px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold align-middle">
                        {feature.tag}
                      </span>
                    )}
                    {feature ? (
                      <span className="relative group cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                        {feature.description}
                        {feature.tooltip && (
                          <span
                            className="ml-1 align-middle inline-flex"
                            data-tooltip-trigger={`${planKey}-${i}`}
                            data-tooltip-content={feature.tooltip}
                            onMouseEnter={(event) => handleTooltipShow(feature.tooltip, event)}
                            onMouseMove={handleTooltipMove}
                            onMouseLeave={handleTooltipHide}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex-1" />

              <MoneyPriceButton
                planKey={planKey}
                userContext={userContext}
                billingType={billingType}
                onAuth={handleAuth}
                onAction={handleAction}
                texts={data.buttonTexts}
                isProcessing={isProcessing}
                enableSubscriptionUpgrade={enableSubscriptionUpgrade}
              />
            </div>
          );
        })}
      </div>

      <Tooltip {...tooltip} />
    </>
  );
}
