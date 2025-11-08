import type { MoneyPriceConfig, MoneyPriceData } from '../money-price/money-price-types';

export type CreditBucketStatus = 'active' | 'expiringSoon' | 'expired';

export interface CreditBucket {
  /** 业务方自定义的积分类型标识，用于映射翻译或埋点 */
  kind: string;
  /** 若提供则使用该名称，否则由组件根据 kind 使用默认翻译 */
  label?: string;
  /** 当前积分余额 */
  balance: number;
  /** 该类型积分的额度上限 */
  limit: number;
  /** 可选状态标签，用于强调过期等状态 */
  status?: CreditBucketStatus;
  /** 积分过期时间（本地时区字符串），用于组件内部推导状态 */
  expiresAt?: string;
  /** 进度百分比（0-100）；未提供时组件按 balance/limit 计算 */
  progressPercent?: number;
  /** 任何额外说明，如剩余天数、使用限制等 */
  description?: string;
}

export interface SubscriptionInfo {
  planName: string;
  periodStart?: string;
  periodEnd?: string;
  manageUrl: string;
}

export interface CreditOverviewData {
  totalBalance: number;
  buckets: CreditBucket[];
  subscription?: SubscriptionInfo;
  checkoutUrl: string;
  subscribeUrl?: string;
  pricingContext?: CreditPricingContext;
}

export interface CreditPricingContext {
  moneyPriceData: MoneyPriceData;
  moneyPriceConfig: MoneyPriceConfig;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enableSubscriptionUpgrade?: boolean;
}
