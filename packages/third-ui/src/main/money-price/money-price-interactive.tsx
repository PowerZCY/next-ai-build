'use client';

import { useClerk } from '@clerk/nextjs';
import { useFingerprintContextSafe } from '@third-ui/clerk/fingerprint';
import { cn } from '@windrun-huaiin/lib/utils';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
  const { redirectToSignIn } = useClerk();
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
  const getUserState = (): UserState => {
    if (!fingerprintContext) return UserState.Anonymous;
    const { xUser, xSubscription } = fingerprintContext;
    
    if (!xUser?.clerkUserId) return UserState.Anonymous;
    if (!xSubscription?.status || xSubscription.status === 'free') return UserState.FreeUser;
    if (xSubscription.priceName?.includes('Pro')) return UserState.ProUser;
    if (xSubscription.priceName?.includes('Ultra')) return UserState.UltraUser;
    return UserState.FreeUser;
  };
  
  const userContext: UserContext = {
    isAuthenticated: !!fingerprintContext?.xUser?.clerkUserId,
    subscriptionStatus: getUserState(),
    subscriptionType: fingerprintContext?.xSubscription?.priceId?.includes('yearly') ? 'yearly' : 'monthly',
    subscriptionEndDate: fingerprintContext?.xSubscription?.subPeriodEnd
  };
  
  // 处理登录
  const handleLogin = () => {
    if (signInPath) {
      router.push(signInPath);
    } else {
      redirectToSignIn();
    }
  };
  
  // 处理升级
  const handleUpgrade = async (plan: string, billingType: string) => {
    // 如果没有配置 API 端点，跳转到首页
    if (!upgradeApiEndpoint) {
      router.push('/');
      return;
    }
    
    setIsProcessing(true);
    try {
      // 获取价格配置
      const pricing = getProductPricing(
        plan as 'free' | 'pro' | 'ultra',
        billingType as 'monthly' | 'yearly',
        config.activeProvider,
        config
      );
      
      // 调用 API 创建支付会话
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
      
      const result = await response.json();
      
      if (result.success && result.checkoutUrl) {
        // 跳转到支付页面
        window.location.href = result.checkoutUrl;
      } else {
        console.error('Failed to create checkout session:', result.error);
      }
    } catch (error) {
      console.error('Error during upgrade:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 更新价格显示
  const updatePriceDisplay = (newBillingType: string) => {
    const providerConfig = getActiveProviderConfig(config);
    
    data.plans.forEach((plan: any) => {
      const productConfig = providerConfig.products[plan.key as 'free' | 'pro' | 'ultra'];
      const pricing = productConfig.plans[newBillingType as 'monthly' | 'yearly'];
      
      // 更新价格值
      const priceValueElement = document.querySelector(`[data-price-value="${plan.key}"]`) as HTMLElement;
      if (priceValueElement) {
        if (pricing.amount === 0) {
          priceValueElement.textContent = 'Free';
        } else {
          priceValueElement.textContent = `${data.currency}${pricing.amount}`;
        }
      }
      
      // 更新单位
      const priceUnitElement = document.querySelector(`[data-price-unit="${plan.key}"]`) as HTMLElement;
      if (priceUnitElement) {
        const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
        priceUnitElement.textContent = billingOption?.unit || '/month';
      }
      
      // 更新原价和折扣
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
            priceDiscountElement.textContent = billingOption.discountText.replace(
              '{percent}',
              String(pricing.discountPercent)
            );
          }
        }
      } else {
        if (priceOriginalElement) priceOriginalElement.style.display = 'none';
        if (priceDiscountElement) priceDiscountElement.style.display = 'none';
      }
      
      // 更新副标题
      const priceSubtitleElement = document.querySelector(`[data-price-subtitle="${plan.key}"]`) as HTMLElement;
      if (priceSubtitleElement && plan.showBillingSubTitle !== false) {
        const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
        priceSubtitleElement.textContent = billingOption?.subTitle || '';
      }
    });
  };
  
  // 更新按钮样式
  const updateButtonStyles = (newBillingType: string) => {
    const monthlyButton = document.querySelector('[data-billing-button="monthly"]') as HTMLButtonElement;
    const yearlyButton = document.querySelector('[data-billing-button="yearly"]') as HTMLButtonElement;
    
    const activeClasses = 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm';
    const inactiveClasses = 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full';
    
    if (monthlyButton && yearlyButton) {
      if (newBillingType === 'monthly') {
        monthlyButton.className = cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', activeClasses);
        yearlyButton.className = cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', inactiveClasses);
      } else {
        monthlyButton.className = cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', inactiveClasses);
        yearlyButton.className = cn('min-w-[120px] px-6 py-2 font-medium transition text-lg relative', activeClasses);
      }
    }
  };
  
  // 更新折扣信息
  const updateDiscountInfo = (newBillingType: string) => {
    const discountInfoElement = document.querySelector('[data-discount-info]') as HTMLElement;
    if (!discountInfoElement) return;
    
    const billingOption = data.billingSwitch.options.find(opt => opt.key === newBillingType);
    const providerConfig = getActiveProviderConfig(config);
    
    // 检查是否有折扣
    let hasDiscount = false;
    let discountPercent = 0;
    
    ['pro', 'ultra'].forEach(planKey => {
      const product = providerConfig.products[planKey as 'pro' | 'ultra'];
      const pricing = product.plans[newBillingType as 'monthly' | 'yearly'];
      if (pricing.discountPercent) {
        hasDiscount = true;
        discountPercent = pricing.discountPercent;
      }
    });
    
    // 清空内容
    discountInfoElement.innerHTML = '';
    
    if (hasDiscount && billingOption?.discountText) {
      const discountBadge = document.createElement('span');
      discountBadge.className = 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap';
      discountBadge.textContent = billingOption.discountText.replace('{percent}', String(discountPercent));
      discountInfoElement.appendChild(discountBadge);
    }
  };
  
  // 使用 useRef 存储 root 实例，避免重复创建
  const rootsRef = React.useRef<Map<string, any>>(new Map());

  // 动态替换按钮
  useEffect(() => {
    data.plans.forEach((plan: any) => {
      const placeholder = document.querySelector(`[data-button-placeholder="${plan.key}"]`);
      if (placeholder) {
        let root = rootsRef.current.get(plan.key);
        
        // 如果还没有创建 root，则创建一个
        if (!root) {
          root = createRoot(placeholder);
          rootsRef.current.set(plan.key, root);
        }
        
        // 渲染按钮
        root.render(
          <MoneyPriceButton
            planKey={plan.key}
            userContext={userContext}
            billingType={billingType}
            onLogin={handleLogin}
            onUpgrade={handleUpgrade}
            texts={data.buttonTexts}
            isProcessing={isProcessing}
          />
        );
      }
    });
  }, [userContext, billingType, isProcessing, data.plans, data.buttonTexts, handleLogin, handleUpgrade]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      rootsRef.current.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          // 忽略卸载错误
        }
      });
      rootsRef.current.clear();
    };
  }, []);
  
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
    
    // 添加 tooltip 功能
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
    
    // 初始化价格显示
    updatePriceDisplay(billingType);
    updateDiscountInfo(billingType);
    
    // 清理
    return () => {
      if (monthlyButton) {
        monthlyButton.removeEventListener('click', handleMonthlyClick);
      }
      if (yearlyButton) {
        yearlyButton.removeEventListener('click', handleYearlyClick);
      }
      
      // 清理 tooltip 事件监听器
      tooltipHandlers.forEach(({ element, handlers }) => {
        element.removeEventListener('mouseenter', handlers.mouseenter);
        element.removeEventListener('mousemove', handlers.mousemove);
        element.removeEventListener('mouseleave', handlers.mouseleave);
      });
    };
  }, [data]);
  
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
  
  return <Tooltip {...tooltip} />;
}