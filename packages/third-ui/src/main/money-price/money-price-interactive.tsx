'use client';

import { useClerk } from '@clerk/nextjs';
import { useFingerprintContextSafe } from '@third-ui/clerk/fingerprint';
import { cn } from '@windrun-huaiin/lib/utils';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoneyPriceButton } from './money-price-button';
import { getActiveProviderConfig, getProductPricing } from './money-price-config-util';
import {
  UserState,
  type MoneyPriceInteractiveProps,
  type UserContext
} from './money-price-types';

export function MoneyPriceInteractive({
  data,
  config,
  upgradeApiEndpoint,
  signInPath
}: MoneyPriceInteractiveProps) {
  const fingerprintContext = useFingerprintContextSafe();
  const { redirectToSignIn, user } = useClerk();
  const router = useRouter();
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>(
    data.billingSwitch.defaultKey as 'monthly' | 'yearly'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  // 确定用户状态
  const getUserState = useCallback((): UserState => {
    if (!fingerprintContext) return UserState.Anonymous;
    const { xUser, xSubscription } = fingerprintContext;
    
    if (!xUser?.clerkUserId) return UserState.Anonymous;
    if (!xSubscription?.status || xSubscription.status === 'free') return UserState.FreeUser;
    if (xSubscription.priceName?.includes('Pro')) return UserState.ProUser;
    if (xSubscription.priceName?.includes('Ultra')) return UserState.UltraUser;
    return UserState.FreeUser;
  }, [fingerprintContext]);

  // 优化 userContext 使用 useMemo
  const userContext = useMemo<UserContext>(() => {
    // 使用 Clerk 的 user 对象判断登录状态
    const isAuth = !!user?.id;
    const userState = getUserState();
    
    return {
      isAuthenticated: isAuth,
      subscriptionStatus: isAuth ? userState : UserState.Anonymous,
      subscriptionType: fingerprintContext?.xSubscription?.priceId?.includes('yearly') ? 'yearly' : 'monthly',
      subscriptionEndDate: fingerprintContext?.xSubscription?.subPeriodEnd
    };
  }, [user, fingerprintContext, getUserState]);

  // 处理登录
  const handleLogin = useCallback(() => {
    if (signInPath) {
      router.push(signInPath);
    } else {
      redirectToSignIn();
    }
  }, [signInPath, redirectToSignIn, router]);

  // 处理升级
  const handleUpgrade = useCallback(async (plan: string, billingType: string) => {
    if (!upgradeApiEndpoint) {
      router.push('/');
      return;
    }
    
    setIsProcessing(true);
    try {
      const pricing = getProductPricing(
        plan as 'free' | 'pro' | 'ultra',
        billingType as 'monthly' | 'yearly',
        config.activeProvider,
        config
      );
      
      const response = await fetch(upgradeApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pricing.priceId,
          plan: plan,
          billingType: billingType,
          provider: config.activeProvider
        })
      });
      
      // 检查是否是重定向或非JSON响应
      if (response.redirected || response.status === 302 || response.status === 301) {
        // 如果是重定向，直接跳转到重定向URL（通常是登录页面）
        window.location.href = response.url;
        return;
      }
      
      // 检查Content-Type是否为JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // 如果不是JSON响应，可能是HTML登录页面，提示用户重新登录
        console.error('Received non-JSON response, user may need to login');
        if (signInPath) {
          window.location.href = signInPath;
        } else {
          redirectToSignIn();
        }
        return;
      }
      
      const result = await response.json();
      
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
  }, [upgradeApiEndpoint, config, router]);

  // 更新价格显示
  const updatePriceDisplay = useCallback((newBillingType: string) => {
    const providerConfig = getActiveProviderConfig(config);
    
    data.plans.forEach((plan: any) => {
      const productConfig = providerConfig.products[plan.key as 'free' | 'pro' | 'ultra'];
      const pricing = productConfig.plans[newBillingType as 'monthly' | 'yearly'];
      
      const priceValueElement = document.querySelector(`[data-price-value="${plan.key}"]`) as HTMLElement;
      if (priceValueElement) {
        if (pricing.amount === 0) {
          priceValueElement.textContent = 'Free';
        } else {
          priceValueElement.textContent = `${data.currency}${pricing.amount}`;
        }
      }
      
      const priceUnitElement = document.querySelector(`[data-price-unit="${plan.key}"]`) as HTMLElement;
      if (priceUnitElement) {
        const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
        priceUnitElement.textContent = billingOption?.unit || '/month';
      }
      
      const priceOriginalElement = document.querySelector(`[data-price-original="${plan.key}"]`) as HTMLElement;
      const priceDiscountElement = document.querySelector(`[data-price-discount="${plan.key}"]`) as HTMLElement;
      if (pricing.originalAmount && pricing.discountPercent) {
        if (priceOriginalElement) {
          priceOriginalElement.style.display = 'inline';
          priceOriginalElement.textContent = `${data.currency}${pricing.originalAmount}`;
        }
        if (priceDiscountElement) {
          priceDiscountElement.style.display = 'inline';
          const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
          if (billingOption?.discountText) {
            priceDiscountElement.textContent = billingOption.discountText.replace('{percent}', String(pricing.discountPercent));
          }
        }
      } else {
        if (priceOriginalElement) priceOriginalElement.style.display = 'none';
        if (priceDiscountElement) priceDiscountElement.style.display = 'none';
      }
    });
  }, [config, data]);

  // 更新折扣信息
  const updateDiscountInfo = useCallback((newBillingType: string) => {
    const discountInfoElement = document.querySelector('[data-discount-info]') as HTMLElement;
    if (discountInfoElement) {
      const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
      let hasDiscount = false;
      let discountPercent = 0;
      const providerConfig = getActiveProviderConfig(config);
      ['pro', 'ultra'].forEach(planKey => {
        const pricing = providerConfig.products[planKey as 'pro' | 'ultra'].plans[newBillingType as 'monthly' | 'yearly'];
        if (pricing.discountPercent) {
          hasDiscount = true;
          discountPercent = pricing.discountPercent;
        }
      });
      discountInfoElement.innerHTML = '';
      if (hasDiscount && billingOption?.discountText) {
        const discountBadge = document.createElement('span');
        discountBadge.className = 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap';
        discountBadge.textContent = billingOption.discountText.replace('{percent}', String(discountPercent));
        discountInfoElement.appendChild(discountBadge);
      }
    }
  }, [config, data]);

  // 更新按钮样式
  const updateButtonStyles = useCallback((newBillingType: string) => {
    const monthlyButton = document.querySelector('[data-billing-button="monthly"]') as HTMLElement;
    const yearlyButton = document.querySelector('[data-billing-button="yearly"]') as HTMLElement;
    if (monthlyButton) {
      monthlyButton.className = newBillingType === 'monthly' 
        ? cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm')
        : cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full');
    }
    if (yearlyButton) {
      yearlyButton.className = newBillingType === 'yearly' 
        ? cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm')
        : cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full');
    }
  }, []);

  // State for button portals
  const [buttonPortals, setButtonPortals] = useState<React.ReactElement[]>([]);

  // 处理月付/年付切换和 tooltip 功能
  useEffect(() => {
    const monthlyButton = document.querySelector('[data-billing-button="monthly"]') as HTMLButtonElement;
    const yearlyButton = document.querySelector('[data-billing-button="yearly"]') as HTMLButtonElement;
    
    const handleMonthlyClick = () => {
      setBillingType('monthly');
      updatePriceDisplay('monthly');
      updateButtonStyles('monthly');
      updateDiscountInfo('monthly');
    };
    
    const handleYearlyClick = () => {
      setBillingType('yearly');
      updatePriceDisplay('yearly');
      updateButtonStyles('yearly');
      updateDiscountInfo('yearly');
    };
    
    if (monthlyButton) {
      monthlyButton.addEventListener('click', handleMonthlyClick);
    }
    if (yearlyButton) {
      yearlyButton.addEventListener('click', handleYearlyClick);
    }
    
    const tooltipHandlers: Array<{
      element: HTMLElement;
      handlers: {
        mouseenter: (e: MouseEvent) => void;
        mousemove: (e: MouseEvent) => void;
        mouseleave: () => void;
      };
    }> = [];
    
    data.plans.forEach((plan: any) => {
      plan.features?.forEach((feature: any, i: number) => {
        if (feature?.tooltip) {
          const tooltipTrigger = document.querySelector(`[data-tooltip-trigger="${plan.key}-${i}"]`) as HTMLElement;
          if (tooltipTrigger) {
            const handlers = {
              mouseenter: (e: MouseEvent) => {
                setTooltip({
                  show: true,
                  content: feature.tooltip,
                  x: e.clientX,
                  y: e.clientY
                });
              },
              mousemove: (e: MouseEvent) => {
                setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
              },
              mouseleave: () => {
                setTooltip(prev => ({ ...prev, show: false }));
              }
            };
            
            tooltipTrigger.addEventListener('mouseenter', handlers.mouseenter);
            tooltipTrigger.addEventListener('mousemove', handlers.mousemove);
            tooltipTrigger.addEventListener('mouseleave', handlers.mouseleave);
            
            tooltipHandlers.push({ element: tooltipTrigger, handlers });
          }
        }
      });
    });

    // Initial updates
    updatePriceDisplay(billingType);
    updateDiscountInfo(billingType);
    updateButtonStyles(billingType);

    return () => {
      if (monthlyButton) {
        monthlyButton.removeEventListener('click', handleMonthlyClick);
      }
      if (yearlyButton) {
        yearlyButton.removeEventListener('click', handleYearlyClick);
      }
      
      tooltipHandlers.forEach(({ element, handlers }) => {
        element.removeEventListener('mouseenter', handlers.mouseenter);
        element.removeEventListener('mousemove', handlers.mousemove);
        element.removeEventListener('mouseleave', handlers.mouseleave);
      });
    };
  }, [data, billingType, updatePriceDisplay, updateButtonStyles, updateDiscountInfo, userContext, handleLogin, handleUpgrade, isProcessing]);

  // Create button portals after component mounts
  useEffect(() => {
    const portals: React.ReactElement[] = [];
    
    data.plans.forEach((plan: any) => {
      const placeholder = document.querySelector(`[data-button-placeholder="${plan.key}"]`) as HTMLElement;
      if (placeholder) {
        console.log('Creating portal for', `[data-button-placeholder="${plan.key}"]`);
        portals.push(
          createPortal(
            <MoneyPriceButton
              key={plan.key}
              planKey={plan.key}
              userContext={userContext}
              billingType={billingType}
              onLogin={handleLogin}
              onUpgrade={handleUpgrade}
              texts={data.buttonTexts}
              isProcessing={isProcessing}
            />,
            placeholder
          )
        );
      }
    });
    
    setButtonPortals(portals);
  }, [data.plans, userContext, billingType, handleLogin, handleUpgrade, data.buttonTexts, isProcessing]);

  // Tooltip 组件
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
      <Tooltip {...tooltip} />
      {buttonPortals}
    </>
  );
}