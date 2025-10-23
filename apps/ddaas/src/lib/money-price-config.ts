import { MoneyPriceConfig, PaymentProviderConfig, EnhancePricePlan, SubscriptionProductConfig, CreditPackProductConfig } from '@third-ui/main/server'

export const moneyPriceConfig: MoneyPriceConfig = {
  paymentProviders: {
    stripe: {
      provider: 'stripe',
      enabled: true,
      // 订阅模式产品
      subscriptionProducts: {
        F1: {
          key: 'F1',
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
        P2: {
          key: 'P2',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT!), // 10
              currency: process.env.STRIPE_PRO_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_MONTHLY_CREDITS!) // 100
            },
            yearly: {
              priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_YEARLY_AMOUNT!), // 8
              originalAmount: 10, // 10*12
              discountPercent: 20,
              currency: process.env.STRIPE_PRO_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_YEARLY_CREDITS!) // 1200
            }
          }
        },
        U3: {
          key: 'U3',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_MONTHLY_AMOUNT!), // 20
              currency: process.env.STRIPE_ULTRA_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_MONTHLY_CREDITS!) // 250
            },
            yearly: {
              priceId: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_YEARLY_AMOUNT!), // 16
              originalAmount: 20, // 20*12
              discountPercent: 20,
              currency: process.env.STRIPE_ULTRA_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_YEARLY_CREDITS!) // 3000
            }
          }
        }
      },
      // 积分包产品
      creditPackProducts: {
        F1: {
          key: 'F1',
          priceId: process.env.STRIPE_ONE_TIME_LESS_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_LESS_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_LESS_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_LESS_CREDITS!)
        },
        P2: {
          key: 'P2',
          priceId: process.env.STRIPE_ONE_TIME_MID_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MID_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MID_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MID_CREDITS!)
        },
        U3: {
          key: 'U3',
          priceId: process.env.STRIPE_ONE_TIME_MORE_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MORE_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MORE_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MORE_CREDITS!)
        }
      }
    },
    paypal: {
      provider: 'paypal',
      // 暂未启用
      enabled: false,
      // 订阅模式产品
      subscriptionProducts: {
        F1: {
          key: 'F1',
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
        P2: {
          key: 'P2',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT!), // 10
              currency: process.env.STRIPE_PRO_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_MONTHLY_CREDITS!) // 100
            },
            yearly: {
              priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_YEARLY_AMOUNT!), // 8
              originalAmount: 10, // 10*12
              discountPercent: 20,
              currency: process.env.STRIPE_PRO_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_YEARLY_CREDITS!) // 1200
            }
          }
        },
        U3: {
          key: 'U3',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_MONTHLY_AMOUNT!), // 20
              currency: process.env.STRIPE_ULTRA_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_MONTHLY_CREDITS!) // 250
            },
            yearly: {
              priceId: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_YEARLY_AMOUNT!), // 16
              originalAmount: 20, // 20*12
              discountPercent: 20,
              currency: process.env.STRIPE_ULTRA_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_YEARLY_CREDITS!) // 3000
            }
          }
        }
      },
      // 积分包产品
      creditPackProducts: {
        F1: {
          key: 'F1',
          priceId: process.env.STRIPE_ONE_TIME_LESS_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_LESS_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_LESS_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_LESS_CREDITS!)
        },
        P2: {
          key: 'P2',
          priceId: process.env.STRIPE_ONE_TIME_MID_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MID_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MID_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MID_CREDITS!)
        },
        U3: {
          key: 'U3',
          priceId: process.env.STRIPE_ONE_TIME_MORE_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MORE_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MORE_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MORE_CREDITS!)
        }
      }
    },
  },
  
  activeProvider: process.env.ACTIVE_PAYMENT_PROVIDER || 'stripe',
  
  display: {
    currency: '$',
    locale: 'en',
    minFeaturesCount: 4
  }
};

// 兼容性函数：统一获取产品配置
function getUnifiedProducts(providerConfig: PaymentProviderConfig): Record<string, SubscriptionProductConfig> {
  // 如果有新的结构，优先使用新结构
  if (providerConfig.subscriptionProducts) {
    return providerConfig.subscriptionProducts;
  }
  // 否则使用兼容的旧结构
  return (providerConfig.products || {}) as Record<string, SubscriptionProductConfig>;
}

// 兼容性函数：获取积分包配置
function getCreditPackProducts(providerConfig: PaymentProviderConfig): Record<string, CreditPackProductConfig> {
  return (providerConfig.creditPackProducts || {}) as Record<string, CreditPackProductConfig>;
}

// 辅助函数：获取当前激活的支付供应商配置
export function getActiveProviderConfig(): PaymentProviderConfig {
  const provider = moneyPriceConfig.activeProvider;
  return moneyPriceConfig.paymentProviders[provider];
}

// 辅助函数：根据查询参数获取价格配置
export function getPriceConfig(
  priceId?: string,
  plan?: string,
  billingType?: string,
  provider?: string
): (EnhancePricePlan & { priceName: string; description: string; interval?: string }) | null {
  const targetProvider = provider || moneyPriceConfig.activeProvider;
  const providerConfig = moneyPriceConfig.paymentProviders[targetProvider];

  if (!providerConfig) {
    return null;
  }

  // 遍历订阅产品
  const subscriptionProducts = getUnifiedProducts(providerConfig);
  for (const [productKey, product] of Object.entries(subscriptionProducts)) {
    for (const [billingKey, planConfig] of Object.entries(product.plans)) {
      // 根据提供的参数进行匹配
      const matches = [
        !priceId || planConfig.priceId === priceId,
        !plan || productKey === plan,
        !billingType || billingKey === billingType,
      ].every(Boolean);

      if (matches) {
        return {
          ...planConfig,
          priceName: `${productKey} ${billingKey}`,
          description: `${productKey} plan - ${billingKey} billing`,
          interval: billingKey === 'yearly' ? 'year' : 'month',
        };
      }
    }
  }

  // 遍历积分包产品
  const creditPacks = getCreditPackProducts(providerConfig);
  for (const [packKey, pack] of Object.entries(creditPacks)) {
    const matches = [
      !priceId || pack.priceId === priceId,
      !plan || packKey === plan,
      !billingType || billingType === 'onetime',
    ].every(Boolean);

    if (matches) {
      return {
        priceId: pack.priceId,
        amount: pack.amount,
        currency: pack.currency,
        credits: pack.credits,
        priceName: `${packKey} Credit Pack`,
        description: `${packKey} Credit Pack - One-time purchase`,
        interval: 'onetime',
      };
    }
  }

  return null;
}

