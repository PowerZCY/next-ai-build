/**
 * Money Price Configuration
 * 价格组件配置文件
 */

import type { MoneyPriceConfig, PaymentProviderConfig, EnhancePricePlan } from './money-price-types';

// 辅助函数：获取当前激活的支付供应商配置
export function getActiveProviderConfig(config: MoneyPriceConfig): PaymentProviderConfig {
  const provider = config.activeProvider;
  return config.paymentProviders[provider];
}

// 辅助函数：获取特定产品的价格信息
export function getProductPricing(
  productKey: 'free' | 'pro' | 'ultra',
  billingType: 'monthly' | 'yearly',
  provider: string,
  config: MoneyPriceConfig
): EnhancePricePlan {
  const providerConfig = config.paymentProviders[provider];
  return providerConfig.products[productKey].plans[billingType];
}