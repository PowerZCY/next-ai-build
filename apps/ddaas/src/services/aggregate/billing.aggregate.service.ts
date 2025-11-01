import {
  creditService,
  CreditType,
  OperationType,
  OrderStatus,
  PaymentStatus,
  PaySupplier,
  subscriptionService,
  SubscriptionStatus,
  transactionService,
  TransactionType,
} from '@/db/index';
import { checkAndFallbackWithNonTCClient } from '@/db/prisma';
import type { Subscription, Transaction } from '@/db/prisma-model-type';
import { runInTransaction } from '../database/prisma-transaction-util';

type NullableString = string | null | undefined;

type SubscriptionRenewalContext = {
  subscription: Subscription;
  renewalOrderId: string;
  invoiceId: string;
  hostedInvoiceUrl?: NullableString;
  invoicePdf?: NullableString;
  billingReason?: NullableString;
  paymentIntentId?: NullableString;
  amountPaidCents: number;
  currency: string;
  renewalCredits: number;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date;
};

type SubscriptionCancelContext = {
  subscription: Subscription;
  canceledAt: Date;
  cancellationDetail?: string 
};

type SubscriptionRefundContext = {
  transaction: Transaction;
  subscription?: Subscription | null;
};

type OneTimeRefundContext = {
  transaction: Transaction;
};

class BillingAggregateService {
  async completeSubscriptionCheckout(
    params: {
      userId: string;
      orderId: string;
      subscriptionId: string;
      stripeStatus: string;
      creditsGranted: number;
      priceId?: NullableString;
      priceName?: NullableString;
      periodStart: Date;
      periodEnd: Date;
      paymentStatus: PaymentStatus;
      sessionId: string;
      paidEmail?: NullableString;
    }
  ): Promise<Subscription> {
    return runInTransaction(async (tx) => {
      const client = checkAndFallbackWithNonTCClient(tx);
      const anonymosPlaceholderRecord = await subscriptionService.findAnonymousInitRecord(params.userId, tx);

      if (!anonymosPlaceholderRecord) {
        throw new Error(`Subscription anonymosPlaceholderRecord not found for user ${params.userId}`);
      }

      const updatedSubscription = await subscriptionService.updateSubscription(
        anonymosPlaceholderRecord.id,
        {
          orderId: params.orderId ?? undefined,
          paySubscriptionId: params.subscriptionId,
          priceId: params.priceId ?? undefined,
          priceName: params.priceName ?? undefined,
          status: params.stripeStatus,
          creditsAllocated: params.creditsGranted || 0,
          subPeriodStart: params.periodStart,
          subPeriodEnd: params.periodEnd,
          updatedAt: new Date(),
        },
        tx
      );

      const now = new Date();

      await transactionService.update(
        params.orderId,
        {
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: params.paymentStatus,
          paySubscriptionId: params.subscriptionId,
          paySessionId: params.sessionId,
          subPeriodStart: params.periodStart,
          subPeriodEnd: params.periodEnd,
          paidEmail: params.paidEmail ?? undefined,
          paidAt: now,
          payUpdatedAt: now,
        },
        tx
      );

      if (params.creditsGranted > 0) {
        await creditService.rechargeCredit(
          params.userId,
          { paid: params.creditsGranted },
          {
            feature: TransactionType.SUBSCRIPTION,
            orderId: params.orderId,
          },
          tx
        );
      }

      await client.credit.update({
        where: { userId: params.userId },
        data: {
          paidStart: params.periodStart,
          paidEnd: params.periodEnd,
        },
      });

      return updatedSubscription;
    });
  }

  async completeOneTimeCheckout(
    params: {
      userId: string;
      orderId: string;
      creditsGranted: number;
      paymentStatus: PaymentStatus;
      payTransactionId: string;
      paidEmail?: NullableString;
      oneTimePaidStart: Date;
      oneTimePaidEnd: Date;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        params.orderId,
        {
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: params.paymentStatus,
          payTransactionId: params.payTransactionId,
          paidAt: now,
          paidEmail: params.paidEmail ?? undefined,
          payUpdatedAt: now,
        },
        tx
      );

      if (params.creditsGranted > 0) {
        await creditService.rechargeCredit(
          params.userId,
          { oneTimePaid: params.creditsGranted },
          {
            feature: TransactionType.ONE_TIME,
            orderId: params.orderId,
          },
          tx
        );
      }

      const client = checkAndFallbackWithNonTCClient(tx);
      await client.credit.update({
        where: { userId: params.userId },
        data: {
          oneTimePaidStart: params.oneTimePaidStart,
          oneTimePaidEnd: params.oneTimePaidEnd,
        },
      });
    });
  }

  async recordInitialInvoiceDetails(
    params: {
      orderId: string;
      invoiceId: string;
      hostedInvoiceUrl?: NullableString;
      invoicePdf?: NullableString;
      billingReason?: NullableString;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.update(
        params.orderId,
        {
          payInvoiceId: params.invoiceId,
          hostedInvoiceUrl: params.hostedInvoiceUrl ?? undefined,
          invoicePdf: params.invoicePdf ?? undefined,
          billingReason: params.billingReason ?? undefined,
          payUpdatedAt: new Date(),
        },
        tx
      );
    });
  }

  async recordSubscriptionRenewalPayment(
    context: SubscriptionRenewalContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.createTransaction(
        {
          userId: context.subscription.userId,
          orderId: context.renewalOrderId,
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: PaymentStatus.PAID,
          paySupplier: PaySupplier.STRIPE,
          paySubscriptionId: context.subscription.paySubscriptionId ?? undefined,
          subPeriodStart: context.periodStart,
          subPeriodEnd: context.periodEnd,
          payInvoiceId: context.invoiceId,
          hostedInvoiceUrl: context.hostedInvoiceUrl ?? undefined,
          invoicePdf: context.invoicePdf ?? undefined,
          billingReason: context.billingReason ?? undefined,
          payTransactionId: context.paymentIntentId ?? undefined,
          priceId: context.subscription.priceId ?? undefined,
          priceName: context.subscription.priceName ?? undefined,
          type: TransactionType.SUBSCRIPTION,
          amount: context.amountPaidCents / 100,
          currency: context.currency.toUpperCase(),
          creditsGranted: context.renewalCredits,
          paidAt: context.paidAt,
          payUpdatedAt: new Date(),
        },
        tx
      );

      await subscriptionService.updateSubscription(
        context.subscription.id,
        {
          status: SubscriptionStatus.ACTIVE,
          orderId: context.renewalOrderId,
          subPeriodStart: context.periodStart,
          subPeriodEnd: context.periodEnd,
          updatedAt: new Date(),
        },
        tx
      );

      if (context.renewalCredits > 0) {
        await creditService.rechargeCredit(
          context.subscription.userId,
          { paid: context.renewalCredits },
          {
            feature: `${TransactionType.SUBSCRIPTION}_renewal`,
            orderId: context.renewalOrderId,
          },
          tx
        );
      }

      const client = checkAndFallbackWithNonTCClient(tx);
      await client.credit.update({
        where: { userId: context.subscription.userId },
        data: {
          paidStart: context.periodStart,
          paidEnd: context.periodEnd,
        },
      });
    });
  }

  async recordInitialPaymentFailure(
    params: {
      orderId: string;
      invoiceId: string;
      paymentIntentId: string;
      detail?: string;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.updateStatus(
        params.orderId,
        OrderStatus.FAILED,
        {
          paymentStatus: PaymentStatus.UN_PAID,
          payInvoiceId: params.invoiceId,
          payTransactionId: params.paymentIntentId,
          payUpdatedAt: new Date(),
          paidDetail: params.detail ?? undefined,
          orderDetail: params.detail ?? undefined,
        },
        tx
      );
    });
  }

  async recordRenewalPaymentFailure(
    params: {
      subscription: Subscription;
      failedOrderId: string;
      invoiceId: string;
      billingReason?: NullableString;
      paymentIntentId: string;
      amountDueCents: number;
      currency: string;
      createdAt: Date;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.createTransaction(
        {
          userId: params.subscription.userId,
          orderId: params.failedOrderId,
          orderStatus: OrderStatus.FAILED,
          paymentStatus: PaymentStatus.UN_PAID,
          paySupplier: PaySupplier.STRIPE,
          paySubscriptionId: params.subscription.paySubscriptionId ?? undefined,
          payInvoiceId: params.invoiceId,
          billingReason: params.billingReason ?? undefined,
          payTransactionId: params.paymentIntentId ?? undefined,
          priceId: params.subscription.priceId ?? undefined,
          priceName: params.subscription.priceName ?? undefined,
          type: TransactionType.SUBSCRIPTION,
          amount: params.amountDueCents / 100,
          currency: params.currency.toUpperCase(),
          creditsGranted: 0,
          paidAt: params.createdAt,
          payUpdatedAt: new Date(),
          orderDetail: 'Subscription renewal payment failed',
        },
        tx
      );

      await creditService.payFailedWatcher(
        {
          userId: params.subscription.userId,
          feature: `${TransactionType.SUBSCRIPTION}_renewal_failed`,
          orderId: params.failedOrderId,
          creditType: CreditType.PAID,
          operationType: OperationType.RECHARGE,
          creditsUsed: 0,
        },
        tx
      );

      await subscriptionService.updateSubscription(
        params.subscription.id,
        {
          status: SubscriptionStatus.PAST_DUE,
          orderId: params.failedOrderId,
          updatedAt: new Date(),
        },
        tx
      );
    });
  }

  async syncSubscriptionFromStripe(
    params: {
      subscription: Subscription;
      status: string;
      periodStart: Date;
      periodEnd: Date;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await subscriptionService.updateSubscription(
        params.subscription.id,
        {
          status: params.status,
          subPeriodStart: params.periodStart,
          subPeriodEnd: params.periodEnd,
          updatedAt: new Date(),
        },
        tx
      );
    });
  }

  async processSubscriptionCancel(
    context: SubscriptionCancelContext
  ): Promise<void> {
    const orderId = context.subscription.orderId;
    const userId = context.subscription.userId;
    if (!orderId || !userId) {
      console.warn(`Ilegal subscription for orderId OR userId is NULL, subscriptionId=${context.subscription.paySubscriptionId}`);
      return;
    }
    await runInTransaction(async (tx) => {
      // 更新订单, 记录取消信息
      await transactionService.update(
        orderId,
        {
          subPeriodCanceledAt: context.canceledAt,
          subCancellationDetail: context.cancellationDetail ?? undefined
        },
        tx
      )
      // 更新订阅信息
      await subscriptionService.updateStatus(context.subscription.id, SubscriptionStatus.CANCELED, tx);

      // 清理积分并留痕
      await creditService.purgePaidCredit(userId, 'cancel_subscription_purge', tx);
    })
  }
  

  async processSubscriptionRefund(
    context: SubscriptionRefundContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        context.transaction.orderId,
        {
          orderStatus: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.UN_PAID,
          payUpdatedAt: now,
        },
        tx
      );

      const subscription =
        context.subscription ??
        (context.transaction.paySubscriptionId
          ? await subscriptionService.findByPaySubscriptionId(context.transaction.paySubscriptionId, tx)
          : null);

      if (subscription) {
        await subscriptionService.updateSubscription(
          subscription.id,
          {
            status: SubscriptionStatus.CANCELED,
            updatedAt: now,
          },
          tx
        );
      }

      const credit = await creditService.getCredit(context.transaction.userId, tx);
      const paidBalance = Math.max(credit?.balancePaid ?? 0, 0);

      if (paidBalance > 0) {
        await creditService.consumeCredit(
          context.transaction.userId,
          { paid: paidBalance },
          {
            feature: OrderStatus.REFUNDED,
            orderId: context.transaction.orderId,
          },
          tx
        );
      }
    });
  }

  async processOneTimeRefund(
    context: OneTimeRefundContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        context.transaction.orderId,
        {
          orderStatus: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.UN_PAID,
          payUpdatedAt: now,
        },
        tx
      );

      const credit = await creditService.getCredit(context.transaction.userId, tx);
      const currentBalance = Math.max(credit?.balanceOneTimePaid ?? 0, 0);
      const granted = Math.max(context.transaction.creditsGranted ?? 0, 0);
      const amountToConsume = Math.min(currentBalance, granted);

      if (amountToConsume > 0) {
        await creditService.consumeCredit(
          context.transaction.userId,
          { oneTimePaid: amountToConsume },
          {
            feature: OrderStatus.REFUNDED,
            orderId: context.transaction.orderId,
          },
          tx
        );
      }
    });
  }
}

export const billingAggregateService = new BillingAggregateService();
