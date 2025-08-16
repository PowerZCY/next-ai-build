# Money Price Component 设计方案

## 1. 概述

基于现有的 PricePlan 组件架构，设计新的 money-price 组件系列，支持动态按钮行为、用户状态响应，并保持与现有组件相同的设计风格和架构理念。

## 2. 核心架构设计

### 2.1 组件分层

```
money-price/
├── money-price.tsx              # 服务端组件，处理SSR、翻译、静态渲染
├── money-price-interactive.tsx  # 客户端组件，处理交互逻辑
├── money-price-config.ts        # 配置文件，包含价格和产品信息
├── money-price-types.ts         # 类型定义
└── money-price-button.tsx       # 按钮组件，封装动态逻辑
```

### 2.2 关键设计原则

1. **服务端/客户端分离**: 延续现有架构，服务端负责静态渲染，客户端负责交互增强
2. **配置集中化**: 所有价格配置统一管理，避免分散维护
3. **按钮行为抽象**: 按钮点击行为由上层业务决定，组件只负责状态展示
4. **渐进增强**: 支持纯服务端渲染，客户端增强可选

## 3. 数据结构设计

### 3.1 配置结构

```typescript
// money-price-config.ts
export interface MoneyPriceConfig {
  // 支付供应商配置
  paymentProviders: {
    [provider: string]: PaymentProviderConfig;
  };
  
  // 当前激活的支付供应商
  activeProvider: string;
  
  // 显示配置
  display: {
    currency: string;
    locale: string;
    minFeaturesCount: number;
  };
}

export interface PaymentProviderConfig {
  provider: 'stripe' | 'alipay' | 'wechat' | 'paypal';
  enabled: boolean;
  products: {
    free: ProductConfig;
    pro: ProductConfig;
    ultra: ProductConfig;
  };
}

export interface ProductConfig {
  key: string;
  name: string; // 只是标识符，实际显示文本来自翻译文件
  // 价格计划（月付和年付）
  plans: {
    monthly: PricePlan;
    yearly: PricePlan;
  };
}

export interface PricePlan {
  // 价格ID（从环境变量读取）
  priceId: string;
  // 价格金额（从环境变量读取）
  amount: number;
  // 原价（用于显示折扣）
  originalAmount?: number;
  // 折扣百分比（仅用于显示）
  discountPercent?: number;
  // 货币单位
  currency: string;
  // 积分数量（如果有）
  credits?: number;
}
```

### 3.2 用户状态类型

```typescript
// money-price-types.ts
export enum UserState {
  Anonymous = 'anonymous',
  FreeUser = 'free',
  ProUser = 'pro',
  UltraUser = 'ultra'
}

export interface UserContext {
  isAuthenticated: boolean;
  subscriptionStatus: UserState;
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionEndDate?: string;
}
```

## 4. 按钮行为设计

| 用户状态 | Free Plan | Pro Plan | Ultra Plan |
|---------|-----------|----------|------------|
| 匿名用户 | "Get Started" → onLogin | "Get Pro" → onLogin | "Get Ultra" → onLogin |
| Free用户 | "Current Plan" (disabled) | "Get Pro" → onUpgrade('pro') | "Get Ultra" → onUpgrade('ultra') |
| Pro用户 | Hidden | "Current Plan" (disabled) | "Upgrade" → onUpgrade('ultra') |
| Ultra用户 | Hidden | Hidden | "Current Plan" (disabled) |


## 5. 配置文件示例

```typescript
// money-price-config.ts
export const moneyPriceConfig: MoneyPriceConfig = {
  paymentProviders: {
    stripe: {
      provider: 'stripe',
      enabled: true,
      products: {
        free: {
          key: 'free',
          name: 'free', // 仅作为标识符
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
          name: 'pro', // 仅作为标识符
          plans: {
            monthly: {
              priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT!), // 10
              currency: process.env.STRIPE_PRO_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_MONTHLY_CREDITS!) // 100
            },
            yearly: {
              priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_YEARLY_AMOUNT!), // 96
              originalAmount: 120, // 10*12
              discountPercent: 20,
              currency: process.env.STRIPE_PRO_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_YEARLY_CREDITS!) // 1200
            }
          }
        },
        ultra: {
          key: 'ultra',
          name: 'ultra', // 仅作为标识符
          plans: {
            monthly: {
              priceId: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_MONTHLY_AMOUNT!), // 20
              currency: process.env.STRIPE_ULTRA_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_MONTHLY_CREDITS!) // 250
            },
            yearly: {
              priceId: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_YEARLY_AMOUNT!), // 192
              originalAmount: 240, // 20*12
              discountPercent: 20,
              currency: process.env.STRIPE_ULTRA_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_YEARLY_CREDITS!) // 3000
            }
          }
        }
      }
    },
    alipay: {
      provider: 'alipay',
      enabled: false, // 暂未启用
      products: {
        // ... 同样的结构，无 description 字段
      }
    },
    wechat: {
      provider: 'wechat',
      enabled: false, // 暂未启用
      products: {
        // ... 同样的结构，无 description 字段
      }
    }
  },
  
  activeProvider: process.env.ACTIVE_PAYMENT_PROVIDER || 'stripe',
  
  display: {
    currency: '$',
    locale: 'en',
    minFeaturesCount: 4
  }
};

// 辅助函数：获取当前激活的支付供应商配置
export function getActiveProviderConfig(): PaymentProviderConfig {
  const provider = moneyPriceConfig.activeProvider;
  return moneyPriceConfig.paymentProviders[provider];
}

// 辅助函数：获取特定产品的价格信息
export function getProductPricing(
  productKey: 'free' | 'pro' | 'ultra',
  billingType: 'monthly' | 'yearly',
  provider?: string
): PricePlan {
  const targetProvider = provider || moneyPriceConfig.activeProvider;
  const providerConfig = moneyPriceConfig.paymentProviders[targetProvider];
  return providerConfig.products[productKey].plans[billingType];
}
```

## 6. 翻译文件结构

```json
// locales/en/moneyPrice.json
{
  "moneyPrice": {
    "title": "Choose Your Plan",
    "subtitle": "Select the best plan for your needs",
    "billingSwitch": {
      "options": [
        { 
          "key": "monthly", 
          "name": "Monthly", 
          "unit": "/month", 
          "discountText": "", 
          "subTitle": "Billed Monthly" 
        },
        { 
          "key": "yearly", 
          "name": "Yearly", 
          "unit": "/month", 
          "discountText": "Save {percent}%", 
          "subTitle": "Billed Annually" 
        }
      ],
      "defaultKey": "yearly"
    },
    "plans": [
      {
        "key": "free",
        "title": "Free",
        "showBillingSubTitle": false,
        "features": [
          { "description": "Basic features" },
          { "description": "Community support" },
          { "description": "Limited usage" },
          { "description": "No credit card required" }
        ]
      },
      {
        "key": "pro",
        "title": "Pro",
        "showBillingSubTitle": true,
        "features": [
          { 
            "description": "All Free features", 
            "tag": "Free" 
          },
          { "description": "Priority support" },
          { 
            "description": "100 credits/month", 
            "tooltip": "1 credit = 1 AI generation" 
          },
          { "description": "Advanced analytics" }
        ]
      },
      {
        "key": "ultra",
        "title": "Ultra",
        "showBillingSubTitle": true,
        "titleTags": ["Most Popular"],
        "features": [
          { 
            "description": "All Pro features", 
            "tag": "Pro" 
          },
          { 
            "description": "250 credits/month", 
            "tooltip": "1 credit = 1 AI generation" 
          },
          { "description": "Early access to new features" },
          { 
            "description": "Dedicated support", 
            "tooltip": "24/7 priority support with dedicated account manager" 
          },
          { "description": "Custom integrations" }
        ]
      }
    ],
    "buttonTexts": {
      "getStarted": "Get Started",
      "getPro": "Get Pro",
      "getUltra": "Get Ultra",
      "currentPlan": "Current Plan",
      "upgrade": "Upgrade"
    }
  }
}
```

## 7. 环境变量配置示例

```bash
# .env.local
# 激活的支付供应商
ACTIVE_PAYMENT_PROVIDER=stripe

# Stripe Pro 月付配置
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx_pro_monthly
STRIPE_PRO_MONTHLY_AMOUNT=10
STRIPE_PRO_MONTHLY_CURRENCY=usd
STRIPE_PRO_MONTHLY_CREDITS=100

# Stripe Pro 年付配置
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx_pro_yearly
STRIPE_PRO_YEARLY_AMOUNT=96
STRIPE_PRO_YEARLY_CURRENCY=usd
STRIPE_PRO_YEARLY_CREDITS=1200

# Stripe Ultra 月付配置
STRIPE_ULTRA_MONTHLY_PRICE_ID=price_xxx_ultra_monthly
STRIPE_ULTRA_MONTHLY_AMOUNT=20
STRIPE_ULTRA_MONTHLY_CURRENCY=usd
STRIPE_ULTRA_MONTHLY_CREDITS=250

# Stripe Ultra 年付配置
STRIPE_ULTRA_YEARLY_PRICE_ID=price_xxx_ultra_yearly
STRIPE_ULTRA_YEARLY_AMOUNT=192
STRIPE_ULTRA_YEARLY_CURRENCY=usd
STRIPE_ULTRA_YEARLY_CREDITS=3000
```

## 8. 使用示例

```typescript
// app/pricing/page.tsx
import { MoneyPrice } from '@/components/money-price';
import { moneyPriceConfig } from '@/config/money-price-config';

export default function PricingPage({ params: { locale } }) {
  return (
    <MoneyPrice
      locale={locale}
      config={moneyPriceConfig}
      upgradeApiEndpoint="/api/stripe/checkout"  // 可选，不传则跳转到首页
      signInPath="/sign-in"  // 可选，不传则使用 Clerk 的 redirectToSignIn
      className="px-4 py-16"
    />
  );
}

// 或者最简配置（升级按钮点击会跳转到首页）
export default function SimplePricingPage({ params: { locale } }) {
  return (
    <MoneyPrice
      locale={locale}
      config={moneyPriceConfig}
    />
  );
}
```

## 9. 关键优势

1. **统一配置管理**: 价格ID和金额配置在一起，通过环境变量统一管理，避免分散维护
2. **多支付供应商支持**: 支持 Stripe、Alipay、WeChat Pay 等多种支付方式，可通过配置切换
3. **平行价格配置**: 月付和年付价格独立配置，折扣仅用于展示
4. **行为抽象**: 按钮点击行为由上层业务决定，组件保持纯粹
5. **组件复用**: 使用现有的 GradientButton 组件，统一按钮样式管理
6. **渐进增强**: 支持纯服务端渲染，客户端功能可选
7. **类型安全**: 完整的 TypeScript 类型定义
8. **国际化支持**: 文本内容通过翻译文件管理
9. **样式一致性**: 通过复用 GradientButton 保持全站按钮风格统一
10. **灵活扩展**: 轻松添加新的支付供应商或产品计划

## 10. 后续优化

1. 添加 A/B 测试支持
2. 集成分析事件追踪
3. 支持更多支付方式
4. 添加优惠码功能
5. 支持团队订阅计划