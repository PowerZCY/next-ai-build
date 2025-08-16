'use client';

import { GradientButton } from '@third-ui/fuma/mdx';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { UserState, type MoneyPriceButtonProps } from './money-price-types';

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
  
  // 决定按钮显示和行为
  const getButtonConfig = () => {
    // 匿名用户
    if (!isAuthenticated) {
      const textKey = planKey === 'free' ? 'getStarted' : `get${capitalize(planKey)}`;
      return {
        text: texts[textKey as keyof typeof texts] || texts.getStarted,
        onClick: onLogin,
        disabled: false,
        hidden: false,
        icon: <icons.ArrowRight />
      };
    }
    
    // 已登录用户
    switch (subscriptionStatus) {
      case UserState.FreeUser:
        if (planKey === 'free') {
          return { 
            text: texts.currentPlan, 
            disabled: true, 
            hidden: false,
            icon: <icons.GlobeLock />
          };
        }
        const getFreeUserText = planKey === 'pro' ? texts.getPro : texts.getUltra;
        return {
          text: getFreeUserText,
          onClick: () => onUpgrade(planKey, billingType),
          disabled: false,
          hidden: false,
          icon: <icons.ArrowRight />
        };
        
      case UserState.ProUser:
        if (planKey === 'free') return { hidden: true };
        if (planKey === 'pro') {
          return { 
            text: texts.currentPlan, 
            disabled: true, 
            hidden: false,
            icon: <icons.GlobeLock />
          };
        }
        return {
          text: texts.upgrade,
          onClick: () => onUpgrade('ultra', billingType),
          disabled: false,
          hidden: false,
          icon: <icons.ArrowRight />
        };
        
      case UserState.UltraUser:
        if (planKey !== 'ultra') return { hidden: true };
        return { 
          text: texts.currentPlan, 
          disabled: true, 
          hidden: false,
          icon: <icons.GlobeLock />
        };
        
      default:
        return { text: '', disabled: true, hidden: true };
    }
  };
  
  const config = getButtonConfig();
  
  if (config.hidden) return null;
  
  return (
    <GradientButton
      title={config.text}
      icon={config.icon}
      onClick={config.onClick}
      disabled={config.disabled || isProcessing}
      align="center"
      className="w-full"
      preventDoubleClick={true}
      loadingText="Processing..."
    />
  );
}