import {
  MoneyPriceConfig,
  PaymentProviderConfig,
  EnhancePricePlan,
  getActiveProviderConfigUtil,
  getCreditsFromPriceIdUtil,
  getPriceConfigUtil
} from '@third-ui/main/server'

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

// ============ 应用层wrapper - 隐藏moneyPriceConfig细节 ============

/**
 * 获取当前激活的支付供应商配置
 *
 * 🔒 安全设计：
 * - wrapper函数隐藏moneyPriceConfig
 * - util层负责从config中提取激活的provider配置
 * - 外部只能通过这个wrapper访问，看不到config对象
 *
 * @returns 当前激活的支付供应商配置
 */
export function getActiveProviderConfig(): PaymentProviderConfig {
  return getActiveProviderConfigUtil(moneyPriceConfig);
}

/**
 * 根据 priceId 获取对应的积分数量
 *
 * 🔒 安全设计：
 * - wrapper函数隐藏moneyPriceConfig
 * - util层负责解析config并提取结果
 * - 外部只能通过这个wrapper访问，看不到config对象
 *
 * @param priceId - 查询的价格ID
 * @param _provider - 保留参数（向后兼容），暂未使用
 * @returns 对应的积分数量，或null
 */
export function getCreditsFromPriceId(priceId?: string, _provider?: string): number | null {
  return getCreditsFromPriceIdUtil(priceId, moneyPriceConfig);
}

/**
 * 根据查询参数获取价格配置
 *
 * 支持三种查询方式：
 * 1. 按 priceId 查询：getPriceConfig(priceId='price_xxx')
 * 2. 按 plan 和 billingType 查询：getPriceConfig(undefined, 'P2', 'monthly')
 * 3. 按 plan 查询：getPriceConfig(undefined, 'P2')
 *
 * 🔒 安全设计：
 * - wrapper函数隐藏moneyPriceConfig
 * - util层负责解析config并提取匹配的结果
 * - 外部只能通过这个wrapper访问，看不到config对象
 *
 * @param priceId - 查询的价格ID（可选）
 * @param plan - 查询的套餐名称如'P2'、'U3'（可选）
 * @param billingType - 查询的计费类型如'monthly'、'yearly'（可选）
 * @param _provider - 保留参数（向后兼容），暂未使用
 * @returns 匹配的价格配置，包含计算好的元数据（priceName、description、interval）
 */
export function getPriceConfig(
  priceId?: string,
  plan?: string,
  billingType?: string,
  _provider?: string
): (EnhancePricePlan & { priceName: string; description: string; interval?: string }) | null {
  return getPriceConfigUtil(priceId, plan, billingType, moneyPriceConfig);
}

