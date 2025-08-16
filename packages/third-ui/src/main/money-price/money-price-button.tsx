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
      case UserState.FreeUser:
        if (planKey === 'free') {
          return { 
            text: texts.currentPlan, 
            disabled: true, 
            hidden: false
          };
        }
        const getFreeUserText = planKey === 'pro' ? texts.getPro : texts.getUltra;
        return {
          text: getFreeUserText,
          onClick: () => onUpgrade(planKey, billingType),
          disabled: false,
          hidden: false
        };
        
      case UserState.ProUser:
        if (planKey === 'free') return { hidden: true };
        if (planKey === 'pro') {
          return { 
            text: texts.currentPlan, 
            disabled: true, 
            hidden: false
          };
        }
        return {
          text: texts.upgrade,
          onClick: () => onUpgrade('ultra', billingType),
          disabled: false,
          hidden: false
        };
        
      case UserState.UltraUser:
        if (planKey !== 'ultra') return { hidden: true };
        return { 
          text: texts.currentPlan, 
          disabled: true, 
          hidden: false
        };
        
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