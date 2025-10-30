import type { Prisma, Subscription, Transaction as PrismaTransaction } from '@prisma/client';
import {
  creditService,
  creditUsageService,
  subscriptionService,
  transactionService,
} from '@/db/index';
import {
  CreditType,
  OperationType,
  OrderStatus,
  PaymentStatus,
  PaySupplier,
  SubscriptionStatus,
  TransactionType,
} from '@/db/index';
import { getDbClient } from '@/db/prisma';

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

type SubscriptionRefundContext = {
  transaction: PrismaTransaction;
  subscription?: Subscription | null;
};

type OneTimeRefundContext = {
  transaction: PrismaTransaction;
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
    },
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const client = getDbClient(tx);
    const placeholder = await subscriptionService.findAnonymousInitRecord(params.userId, tx);

    if (!placeholder) {
      throw new Error(`Subscription placeholder not found for user ${params.userId}`);
    }

    const updatedSubscription = await subscriptionService.updateSubscription(
      placeholder.id,
      {
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
    },
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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

    const client = getDbClient(tx);
    await client.credit.update({
      where: { userId: params.userId },
      data: {
        oneTimePaidStart: params.oneTimePaidStart,
        oneTimePaidEnd: params.oneTimePaidEnd,
      },
    });
  }

  async recordInitialInvoiceDetails(
    params: {
      orderId: string;
      invoiceId: string;
      hostedInvoiceUrl?: NullableString;
      invoicePdf?: NullableString;
      billingReason?: NullableString;
    },
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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
  }

  async recordSubscriptionRenewalPayment(
    context: SubscriptionRenewalContext,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    await subscriptionService.updateSubscription(
      context.subscription.id,
      {
        status: SubscriptionStatus.ACTIVE,
        subPeriodStart: context.periodStart,
        subPeriodEnd: context.periodEnd,
        updatedAt: new Date(),
      },
      tx
    );

    await transactionService.createTransaction(
      {
        userId: context.subscription.userId,
        orderId: context.renewalOrderId,
        orderStatus: OrderStatus.SUCCESS,
        paymentStatus: PaymentStatus.PAID,
        paySupplier: PaySupplier.STRIPE,
        paySubscriptionId: context.subscription.paySubscriptionId ?? undefined,
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

    const client = getDbClient(tx);
    await client.credit.update({
      where: { userId: context.subscription.userId },
      data: {
        paidStart: context.periodStart,
        paidEnd: context.periodEnd,
      },
    });
  }

  async recordInitialPaymentFailure(
    params: {
      orderId: string;
      invoiceId: string;
      detail?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    await transactionService.updateStatus(
      params.orderId,
      OrderStatus.FAILED,
      {
        paymentStatus: PaymentStatus.UN_PAID,
        payInvoiceId: params.invoiceId,
        payUpdatedAt: new Date(),
        paidDetail: params.detail ?? undefined,
        orderDetail: params.detail ?? undefined,
      },
      tx
    );
  }

  async recordRenewalPaymentFailure(
    params: {
      subscription: Subscription;
      failedOrderId: string;
      invoiceId: string;
      billingReason?: NullableString;
      paymentIntentId?: NullableString;
      amountDueCents: number;
      currency: string;
      createdAt: Date;
    },
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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

    await creditUsageService.recordUsage(
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
        updatedAt: new Date(),
      },
      tx
    );
  }

  async syncSubscriptionFromStripe(
    params: {
      subscription: Subscription;
      status: string;
      periodStart: Date;
      periodEnd: Date;
    },
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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
  }

  async processSubscriptionRefund(
    context: SubscriptionRefundContext,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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
  }

  async processOneTimeRefund(
    context: OneTimeRefundContext,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
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
  }
}

export const billingAggregateService = new BillingAggregateService();
