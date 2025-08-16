/**
 * Money Price Configuration
 * 价格组件配置文件
 */

import type { MoneyPriceConfig, PaymentProviderConfig, EnhancePricePlan } from './money-price-types';

// 示例配置
export const moneyPriceConfig: MoneyPriceConfig = {
  paymentProviders: {
    stripe: {
      provider: 'stripe',
      enabled: true,
      products: {
        free: {
          key: 'free',
          name: 'free', // Just a key, actual display name comes from translation
          plans: {
            monthly: {
              priceId: 'free',
              amount: 0,
              currency: 'usd',
              credits: 0
            },
            yearly: {
              priceId: 'free',
              amount: 0,
              currency: 'usd',
              credits: 0
            }
          }
        },
        pro: {
          key: 'pro',
          name: 'pro', // Just a key, actual display name comes from translation
          plans: {
            monthly: {
              priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
              amount: Number(process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_AMOUNT) || 10,
              currency: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_CURRENCY || 'usd',
              credits: Number(process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_CREDITS) || 100
            },
            yearly: {
              priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
              amount: Number(process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_AMOUNT) || 96,
              originalAmount: 120,
              discountPercent: 20,
              currency: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_CURRENCY || 'usd',
              credits: Number(process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_CREDITS) || 1200
            }
          }
        },
        ultra: {
          key: 'ultra',
          name: 'ultra', // Just a key, actual display name comes from translation
          plans: {
            monthly: {
              priceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PRICE_ID || 'price_ultra_monthly',
              amount: Number(process.env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_AMOUNT) || 20,
              currency: process.env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_CURRENCY || 'usd',
              credits: Number(process.env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_CREDITS) || 250
            },
            yearly: {
              priceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PRICE_ID || 'price_ultra_yearly',
              amount: Number(process.env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_AMOUNT) || 192,
              originalAmount: 240,
              discountPercent: 20,
              currency: process.env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_CURRENCY || 'usd',
              credits: Number(process.env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_CREDITS) || 3000
            }
          }
        }
      }
    },
    alipay: {
      provider: 'alipay',
      enabled: false,
      products: {
        free: {
          key: 'free',
          name: 'free',
          plans: {
            monthly: {
              priceId: 'free',
              amount: 0,
              currency: 'cny',
              credits: 0
            },
            yearly: {
              priceId: 'free',
              amount: 0,
              currency: 'cny',
              credits: 0
            }
          }
        },
        pro: {
          key: 'pro',
          name: 'pro',
          plans: {
            monthly: {
              priceId: 'alipay_pro_monthly',
              amount: 70,
              currency: 'cny',
              credits: 100
            },
            yearly: {
              priceId: 'alipay_pro_yearly',
              amount: 672,
              originalAmount: 840,
              discountPercent: 20,
              currency: 'cny',
              credits: 1200
            }
          }
        },
        ultra: {
          key: 'ultra',
          name: 'ultra',
          plans: {
            monthly: {
              priceId: 'alipay_ultra_monthly',
              amount: 140,
              currency: 'cny',
              credits: 250
            },
            yearly: {
              priceId: 'alipay_ultra_yearly',
              amount: 1344,
              originalAmount: 1680,
              discountPercent: 20,
              currency: 'cny',
              credits: 3000
            }
          }
        }
      }
    },
    wechat: {
      provider: 'wechat',
      enabled: false,
      products: {
        free: {
          key: 'free',
          name: 'free',
          plans: {
            monthly: {
              priceId: 'free',
              amount: 0,
              currency: 'cny',
              credits: 0
            },
            yearly: {
              priceId: 'free',
              amount: 0,
              currency: 'cny',
              credits: 0
            }
          }
        },
        pro: {
          key: 'pro',
          name: 'pro',
          plans: {
            monthly: {
              priceId: 'wechat_pro_monthly',
              amount: 70,
              currency: 'cny',
              credits: 100
            },
            yearly: {
              priceId: 'wechat_pro_yearly',
              amount: 672,
              originalAmount: 840,
              discountPercent: 20,
              currency: 'cny',
              credits: 1200
            }
          }
        },
        ultra: {
          key: 'ultra',
          name: 'ultra',
          plans: {
            monthly: {
              priceId: 'wechat_ultra_monthly',
              amount: 140,
              currency: 'cny',
              credits: 250
            },
            yearly: {
              priceId: 'wechat_ultra_yearly',
              amount: 1344,
              originalAmount: 1680,
              discountPercent: 20,
              currency: 'cny',
              credits: 3000
            }
          }
        }
      }
    }
  },
  
  activeProvider: process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_PROVIDER || 'stripe',
  
  display: {
    currency: '$',
    locale: 'en',
    minFeaturesCount: 4
  }
};

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