/**
 * Money Price Configuration
 * 价格组件配置文件
 */

import type { MoneyPriceConfig, PaymentProviderConfig, EnhancePricePlan } from './money-price-types';

/**
 * 获取当前激活的支付供应商配置
 *
 * 🔒 安全设计：
 * - util层负责从config中提取激活的provider配置
 * - 只返回提取的结果，不暴露任何config结构
 * - 调用方（应用层）通过wrapper隐藏config对象
 *
 * @param config - MoneyPriceConfig对象（由应用层提供）
 * @returns 当前激活的支付供应商配置
 */
export function getActiveProviderConfigUtil(config: MoneyPriceConfig): PaymentProviderConfig {
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

// ============ 安全的util函数 - 只接收简单的映射表参数，不暴露任何config细节 ============

/**
 * 根据 priceId 获取对应的积分数量
 *
 * 🔒 安全设计：
 * - util层负责解析config，提取所需数据
 * - 只返回查询结果，不暴露任何config结构
 * - 调用方（应用层）通过wrapper隐藏config对象
 *
 * @param priceId - 查询的价格ID
 * @param config - MoneyPriceConfig对象（由应用层提供）
 * @returns 对应的积分数量，或null
 */
export function getCreditsFromPriceIdUtil(
  priceId: string | undefined,
  config: MoneyPriceConfig
): number | null {
  if (!priceId) {
    return null;
  }

  // 遍历所有支付提供商
  for (const provider of Object.values(config.paymentProviders)) {
    // 遍历订阅产品
    const subscriptionProducts = (
      provider.subscriptionProducts || provider.products
    ) as Record<string, any>;

    if (subscriptionProducts) {
      for (const product of Object.values(subscriptionProducts)) {
        if (product.plans) {
          for (const planConfig of Object.values(product.plans)) {
            const plan = planConfig as any;
            if (plan.priceId === priceId && plan.credits !== undefined) {
              return plan.credits;
            }
          }
        }
      }
    }

    // 遍历积分包产品
    const creditPacks = provider.creditPackProducts as Record<string, any>;
    if (creditPacks) {
      for (const pack of Object.values(creditPacks)) {
        const packTyped = pack as any;
        if (packTyped.priceId === priceId && packTyped.credits !== undefined) {
          return packTyped.credits;
        }
      }
    }
  }

  return null;
}

/**
 * 根据查询参数获取价格配置
 *
 * 支持三种查询方式：
 * 1. 按 priceId 直接查询
 * 2. 按 plan + billingType 查询
 * 3. 按 plan 查询
 *
 * 🔒 安全设计：
 * - util层负责解析config，提取和匹配数据
 * - 只返回查询结果，不暴露任何config结构
 * - 调用方（应用层）通过wrapper隐藏config对象
 *
 * @param priceId - 查询的价格ID（可选）
 * @param plan - 查询的套餐名称如'P2'、'U3'（可选）
 * @param billingType - 查询的计费类型如'monthly'、'yearly'（可选）
 * @param config - MoneyPriceConfig对象（由应用层提供）
 * @returns 匹配的价格配置，包含计算好的元数据（priceName、description、interval）
 */
export function getPriceConfigUtil(
  priceId: string | undefined,
  plan: string | undefined,
  billingType: string | undefined,
  config: MoneyPriceConfig
): (EnhancePricePlan & { priceName: string; description: string; interval?: string }) | null {
  // 遍历所有支付提供商
  for (const provider of Object.values(config.paymentProviders)) {
    // 遍历订阅产品
    const subscriptionProducts = (
      provider.subscriptionProducts || provider.products
    ) as Record<string, any>;

    if (subscriptionProducts) {
      for (const [productKey, product] of Object.entries(subscriptionProducts)) {
        if (product.plans) {
          for (const [billingKey, planConfig] of Object.entries(product.plans)) {
            const plan_config = planConfig as any;

            // 匹配逻辑：按优先级尝试
            // 1. 按priceId精确匹配（优先级最高）
            if (priceId && plan_config.priceId === priceId) {
              return {
                ...plan_config,
                priceName: `${productKey} ${billingKey}`,
                description: `${productKey} plan - ${billingKey} billing`,
                interval: billingKey === 'yearly' ? 'year' : 'month',
              };
            }

            // 2. 按plan和billingType同时匹配
            if (!priceId && plan && billingType) {
              if (productKey === plan && billingKey === billingType) {
                return {
                  ...plan_config,
                  priceName: `${productKey} ${billingKey}`,
                  description: `${productKey} plan - ${billingKey} billing`,
                  interval: billingKey === 'yearly' ? 'year' : 'month',
                };
              }
            }

            // 3. 按plan匹配（billingType为空时）
            if (!priceId && !billingType && plan && productKey === plan) {
              return {
                ...plan_config,
                priceName: `${productKey} ${billingKey}`,
                description: `${productKey} plan - ${billingKey} billing`,
                interval: billingKey === 'yearly' ? 'year' : 'month',
              };
            }
          }
        }
      }
    }

    // 遍历积分包产品
    const creditPacks = provider.creditPackProducts as Record<string, any>;
    if (creditPacks) {
      for (const [packKey, pack] of Object.entries(creditPacks)) {
        const pack_typed = pack as any;

        // 积分包匹配
        if (priceId && pack_typed.priceId === priceId) {
          return {
            priceId: pack_typed.priceId,
            amount: pack_typed.amount,
            currency: pack_typed.currency,
            credits: pack_typed.credits,
            priceName: `${packKey} Credit Pack`,
            description: `${packKey} Credit Pack - One-time purchase`,
            interval: 'onetime',
          };
        }

        // 按plan和onetime匹配
        if (!priceId && plan && billingType === 'onetime') {
          if (packKey === plan) {
            return {
              priceId: pack_typed.priceId,
              amount: pack_typed.amount,
              currency: pack_typed.currency,
              credits: pack_typed.credits,
              priceName: `${packKey} Credit Pack`,
              description: `${packKey} Credit Pack - One-time purchase`,
              interval: 'onetime',
            };
          }
        }

        // 按plan匹配（billingType为空时也能找到first积分包）
        if (!priceId && !billingType && plan && packKey === plan) {
          return {
            priceId: pack_typed.priceId,
            amount: pack_typed.amount,
            currency: pack_typed.currency,
            credits: pack_typed.credits,
            priceName: `${packKey} Credit Pack`,
            description: `${packKey} Credit Pack - One-time purchase`,
            interval: 'onetime',
          };
        }
      }
    }
  }

  return null;
}