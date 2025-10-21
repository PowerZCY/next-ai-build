// Database Field Enums
// Keep in sync with DB CHECK constraints

export const UserStatus = {
  ANONYMOUS: 'anonymous',
  REGISTERED: 'registered',
  FROZEN: 'frozen',
  DELETED: 'deleted',
} as const;

export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  INCOMPLETE: 'incomplete',
  TRIALING: 'trialing',
} as const;

export const OrderStatus = {
  CREATED: 'created',
  SUCCESS: 'success',
  REFUNDED: 'refunded',
  CANCELED: 'canceled',
  FAILED: 'failed',
} as const;

export const TransactionType = {
  SUBSCRIPTION: 'subscription',
  ONE_TIME: 'one_time',
} as const;

export const CreditType = {
  FREE: 'free',
  PAID: 'paid',
} as const;

export const OperationType = {
  CONSUME: 'consume',
  RECHARGE: 'recharge',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
} as const;

export const PaySupplier = {
  STRIPE: 'Stripe',
  APPLE: 'Apple',
  PAYPAL: 'Paypal',
} as const;

// Type Definitions
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];
export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export type CreditType = typeof CreditType[keyof typeof CreditType];
export type OperationType = typeof OperationType[keyof typeof OperationType];
export type PaySupplier = typeof PaySupplier[keyof typeof PaySupplier];

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