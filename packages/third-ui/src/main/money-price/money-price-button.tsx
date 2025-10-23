'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { UserState, type MoneyPriceButtonProps } from './money-price-types';
import React, { useState } from 'react';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function MoneyPriceButton({
  planKey,
  userContext,
  billingType,
  onLogin,
  onUpgrade,
  texts,
  isProcessing = false
}: MoneyPriceButtonProps) {
  const { isAuthenticated, subscriptionStatus } = userContext;
  const [isLoading, setIsLoading] = useState(false);
  const subscriptionBilling = userContext.subscriptionType;
  const planTier = planKey;
  const planBilling = billingType;

  const getPlanRank = (tier: 'free' | 'pro' | 'ultra', billing: 'monthly' | 'yearly') => {
    if (tier === 'free') return 0;
    if (tier === 'pro') return billing === 'monthly' ? 1 : 3;
    if (tier === 'ultra') return billing === 'monthly' ? 2 : 4;
    return 0;
  };

  // 决定按钮显示和行为
  const getButtonConfig = () => {
    // 匿名用户
    if (!isAuthenticated) {
      const textKey = planKey === 'free' ? 'getStarted' : `get${capitalize(planKey)}`;
      return {
        text: texts[textKey as keyof typeof texts] || texts.getStarted,
        onClick: onLogin,
        disabled: false,
        hidden: false
      };
    }
    
    // 已登录用户
    switch (subscriptionStatus) {
      case UserState.FreeUser: {
        if (planTier === 'free') {
          return {
            text: texts.currentPlan,
            disabled: true,
            hidden: false
          };
        }
        return {
          text: texts.upgrade,
          onClick: () => onUpgrade(planTier, planBilling),
          disabled: false,
          hidden: false
        };
      }

      case UserState.ProUser: {
        // 不允许降级到 Free
        if (planTier === 'free') {
          return { hidden: true };
        }

        const currentBilling = subscriptionBilling === 'yearly' ? 'yearly' : 'monthly';
        const currentRank = getPlanRank('pro', currentBilling);

        if (planTier === 'pro') {
          const targetRank = getPlanRank('pro', planBilling);

          if (planBilling === currentBilling) {
            return {
              text: texts.currentPlan,
              disabled: true,
              hidden: false
            };
          }

          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onUpgrade('pro', planBilling),
              disabled: false,
              hidden: false
            };
          }

          return { hidden: true };
        }

        if (planTier === 'ultra') {
          const targetRank = getPlanRank('ultra', planBilling);
          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onUpgrade('ultra', planBilling),
              disabled: false,
              hidden: false
            };
          }

          return { hidden: true };
        }
        
        return { hidden: true };
      }

      case UserState.UltraUser: {
        const currentBilling = subscriptionBilling === 'yearly' ? 'yearly' : 'monthly';
        const currentRank = getPlanRank('ultra', currentBilling);

        if (planTier === 'free') {
          return { hidden: true };
        }

        if (planTier === 'pro') {
          const targetRank = getPlanRank('pro', planBilling);
          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onUpgrade('pro', planBilling),
              disabled: false,
              hidden: false
            };
          }
          return { hidden: true };
        }

        if (planTier === 'ultra') {
          const targetRank = getPlanRank('ultra', planBilling);

          if (planBilling === currentBilling) {
            return {
              text: texts.currentPlan,
              disabled: true,
              hidden: false
            };
          }

          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onUpgrade('ultra', planBilling),
              disabled: false,
              hidden: false
            };
          }
        }

        return { hidden: true };
      }

      default:
        return { text: '', disabled: true, hidden: true };
    }
  };
  
  const config = getButtonConfig();
  
  if (config.hidden) return null;

  const handleClick = async (e: React.MouseEvent) => {
    if (config.disabled || isLoading || isProcessing) {
      e.preventDefault();
      return;
    }

    if (config.onClick) {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        const result = config.onClick();
        // Handle both sync and async functions
        await Promise.resolve(result);
      } catch (error) {
        console.error('MoneyPriceButton onClick error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = config.disabled || isLoading || isProcessing;
  const displayText = isLoading ? 'Processing...' : config.text;
  
  return (
    <button
      className={cn(
        'w-full py-2 mt-auto text-white text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full',
        isDisabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700'
      )}
      disabled={isDisabled}
      onClick={handleClick}
      type="button"
      data-plan-button={planKey}
    >
      {displayText}
    </button>
  );
}
