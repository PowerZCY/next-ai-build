// Database Field Enums
// Keep in sync with DB CHECK constraints

export const UserStatus = {
  // 匿名用户
  ANONYMOUS: 'anonymous',
  // 注册用户
  REGISTERED: 'registered',
  // 管理员介入管控
  FROZEN: 'frozen',
  // 用户注销，数据软删除，用户数据将不可复用
  DELETED: 'deleted',
} as const;

export const SubscriptionStatus = {
  // 初始状态或注销后状态
  INCOMPLETE: 'incomplete',
  // 订阅试用期
  TRIALING: 'trialing',
  // 有效订阅激活
  ACTIVE: 'active',
  // 订阅过期
  PAST_DUE: 'past_due',
  // 取消订阅
  CANCELED: 'canceled',
} as const;

export const OrderStatus = {
  // 初始状态
  CREATED: 'created',
  // 中间状态，待支付，可能是支付失败事件触发
  PENDING_UNPAID: 'pending_unpaid',
  // 中间状态(也可是最终状态)，支付成功，后续可变为「退款或取消」
  SUCCESS: 'success',
  // 中间状态(也可是最终状态)，CheckOut失败或者是支付失败，后续可变为「退款或取消」
  FAILED: 'failed',
  // 最终状态，已退款
  REFUNDED: 'refunded',
  // 最终状态，已取消
  CANCELED: 'canceled',
} as const;

export const TransactionType = {
  // 订阅订单
  SUBSCRIPTION: 'subscription',
  // 即付订单
  ONE_TIME: 'one_time',
} as const;

export const CreditType = {
  // 订阅积分
  PAID: 'paid',
  // 即付积分
  ONE_TIME_PAID: 'one_time_paid',
  // 免费积分
  FREE: 'free',
} as const;

export const OperationType = {
  // 系统奖励积分
  SYS_GIFT: 'system_gift',
  // 用户消费积分
  CONSUME: 'consume',
  // 用户充值积分
  RECHARGE: 'recharge',
  // 管理员介入冻结积分
  FREEZE: 'freeze',
  // 管理员介入解冻积分
  UNFREEZE: 'unfreeze',
  // 管理员介入赠送积分
  ADJUST_INCREASE: 'adjust_increase',
  // 管理员介入抹去积分
  ADJUST_DECREASE: 'adjust_decrease',
  // 清理积分，事件触发或者是积分过期触发
  PURGE: 'purge',
} as const;

// 支付厂商类型
export const PaySupplier = {
  STRIPE: 'Stripe',
  APPLE: 'Apple',
  PAYPAL: 'Paypal',
} as const;

export const BillingReason = {
  // 首次订阅
  SUBSCRIPTION_CREATE: 'subscription_create',
  // 续订
  SUBSCRIPTION_CYCLE: 'subscription_cycle',
} as const;

export const PaymentStatus = {
  // 已支付
  PAID: 'paid',
  // 待支付
  UN_PAID: 'un_paid',
  // 无需支付
  NO_PAYMENT_REQUIRED: 'no_payment_required',
} as const;


// Type Definitions
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];
export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export type CreditType = typeof CreditType[keyof typeof CreditType];
export type OperationType = typeof OperationType[keyof typeof OperationType];
export type PaySupplier = typeof PaySupplier[keyof typeof PaySupplier];
export type BillingReason = typeof BillingReason[keyof typeof BillingReason];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// Validation Functions
export const isValidUserStatus = (status: string): status is UserStatus => {
  return Object.values(UserStatus).includes(status as UserStatus);
};

export const isValidSubscriptionStatus = (status: string): status is SubscriptionStatus => {
  return Object.values(SubscriptionStatus).includes(status as SubscriptionStatus);
};

export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(OrderStatus).includes(status as OrderStatus);
};

export const isValidTransactionType = (type: string): type is TransactionType => {
  return Object.values(TransactionType).includes(type as TransactionType);
};

export const isValidCreditType = (type: string): type is CreditType => {
  return Object.values(CreditType).includes(type as CreditType);
};

export const isValidOperationType = (type: string): type is OperationType => {
  return Object.values(OperationType).includes(type as OperationType);
};

export const isValidPaySupplier = (supplier: string): supplier is PaySupplier => {
  return Object.values(PaySupplier).includes(supplier as PaySupplier);
};

export const isValidBillingReason = (reason: string): reason is BillingReason => {
  return Object.values(BillingReason).includes(reason as BillingReason);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return Object.values(PaymentStatus).includes(status as PaymentStatus);
};
