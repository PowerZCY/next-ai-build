/**
 * Money Price Component Types
 * 价格组件类型定义
 */

// 用户状态枚举
export enum UserState {
  Anonymous = 'anonymous',
  FreeUser = 'free',
  ProUser = 'pro',
  UltraUser = 'ultra'
}

// 用户上下文
export interface UserContext {
  isAuthenticated: boolean;
  subscriptionStatus: UserState;
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionEndDate?: string;
}

// 支付供应商类型
export type PaymentProvider = 'stripe' | 'apple' | 'paypal' | 'wechat' | 'alipay'  ;

// 价格计划
export interface EnhancePricePlan {
  priceId: string;
  amount: number;
  originalAmount?: number;
  discountPercent?: number;
  currency: string;
  credits?: number;
}

// 产品配置
export interface ProductConfig {
  key: string;
  name: string;
  plans: {
    monthly: EnhancePricePlan;
    yearly: EnhancePricePlan;
  };
}

// 支付供应商配置
export interface PaymentProviderConfig {
  provider: PaymentProvider;
  enabled: boolean;
  products: {
    free: ProductConfig;
    pro: ProductConfig;
    ultra: ProductConfig;
  };
}

// 主配置
export interface MoneyPriceConfig {
  paymentProviders: {
    [provider: string]: PaymentProviderConfig;
  };
  activeProvider: string;
  display: {
    currency: string;
    locale: string;
    minFeaturesCount: number;
  };
}

// 组件属性
export interface MoneyPriceProps {
  locale: string;
  config: MoneyPriceConfig;
  className?: string;
  upgradeApiEndpoint?: string;
  signInPath?: string;
  sectionClassName?: string;
}

// 交互组件属性
export interface MoneyPriceInteractiveProps {
  data: MoneyPriceData;
  config: MoneyPriceConfig;
  upgradeApiEndpoint?: string;
  signInPath?: string;
}

// 按钮组件属性
export interface MoneyPriceButtonProps {
  planKey: 'free' | 'pro' | 'ultra';
  userContext: UserContext;
  billingType: 'monthly' | 'yearly';
  onLogin: () => void;
  onUpgrade: (plan: string, billingType: string) => void | Promise<void>;
  texts: {
    getStarted: string;
    getPro: string;
    getUltra: string;
    currentPlan: string;
    upgrade: string;
  };
  isProcessing?: boolean;
}

// 数据结构
export interface MoneyPriceData {
  title: string;
  subtitle: string;
  billingSwitch: {
    options: Array<{
      key: string;
      name: string;
      unit: string;
      discountText: string;
      subTitle?: string;
    }>;
    defaultKey: string;
  };
  plans: Array<{
    key: string;
    title: string;
    showBillingSubTitle?: boolean;
    titleTags?: string[];
    features?: Array<{
      description: string;
      icon?: string;
      tag?: string;
      tooltip?: string;
    }>;
  }>;
  buttonTexts: {
    getStarted: string;
    getPro: string;
    getUltra: string;
    currentPlan: string;
    upgrade: string;
  };
  currency: string;
}