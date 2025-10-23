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
  productKey: 'F1' | 'P2' | 'U3',
  billingType: string,
  provider: string,
  config: MoneyPriceConfig
): EnhancePricePlan {
  const providerConfig = config.paymentProviders[provider];

  // 如果是 onetime 类型，尝试从积分包中获取
  if (billingType === 'onetime') {
    const creditPacks = providerConfig.creditPackProducts;
    // 直接使用相同的 key：F1->F1, P2->P2, U3->U3
    if (creditPacks && creditPacks[productKey]) {
      const pack = creditPacks[productKey];
      return {
        priceId: pack.priceId,
        amount: pack.amount,
        currency: pack.currency,
        credits: pack.credits
      };
    }
  }

  // 否则从订阅产品中获取
  const products = providerConfig.subscriptionProducts || providerConfig.products;
  if (products && products[productKey] && products[productKey].plans[billingType]) {
    return products[productKey].plans[billingType];
  }

  throw new Error(`Product pricing not found for ${productKey} ${billingType}`);
}