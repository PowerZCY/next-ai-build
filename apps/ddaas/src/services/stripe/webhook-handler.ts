/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stripe Webhook Handler
 *
 * ===== PAYMENT FLOW ARCHITECTURE (SIMPLIFIED) =====
 *
 * PRINCIPLE: Leverage Stripe API for accurate data immediately.
 * Why? Stripe provides complete subscription info via API (includes billing periods).
 * No need to wait for invoice.paid to get period data.
 *
 * ONE-TIME PAYMENTS:
 * checkout.session.completed [FINAL EVENT]
 * ├─ Transaction.orderStatus = SUCCESS
 * ├─ Credit.balanceOneTimePaid += credits (1-year expiration)
 * └─ Records credit usage
 *
 * SUBSCRIPTIONS (Complete in checkout phase):
 * checkout.session.completed [FINAL EVENT]
 * ├─ Calls Stripe API to get subscription with accurate period
 * ├─ Creates Subscription record with COMPLETE period info
 * ├─ Transaction.orderStatus = SUCCESS (✅ Complete here)
 * ├─ Credit.balancePaid += credits with correct period
 * └─ Records credit usage
 *
 * SUBSCRIPTION RENEWALS:
 * invoice.paid (with billing_reason !== 'subscription_create')
 * ├─ Updates Subscription with new period from invoice.lines[0].period
 * ├─ Creates new renewal Transaction record
 * ├─ Credit.balancePaid += renewal credits
 * └─ Records renewal usage
 *
 * INVOICE TRACKING:
 * invoice.paid (with billing_reason === 'subscription_create')
 * └─ Records invoice URLs on initial transaction (hostedInvoiceUrl, invoicePdf)
 *
 * DATABASE GUARANTEES:
 * - No race conditions on orderStatus (already SUCCESS before invoice.paid)
 * - Safe for webhook replay
 */

import { billingAggregateService } from '@/agg/index';
import {
  Apilogger,
  BillingReason,
  OrderStatus,
  PaymentStatus,
  subscriptionService,
  transactionService,
  TransactionType
} from '@/db/index';
import { Transaction } from '@/db/prisma-model-type';
import { oneTimeExpiredDays } from '@/lib/appConfig';
import { getCreditsFromPriceId } from '@/lib/money-price-config';
import { stripe } from '@/lib/stripe-config';
import Stripe from 'stripe';

const mapPaymentStatus = (
  status?: Stripe.Checkout.Session.PaymentStatus | null
): PaymentStatus => {
  switch (status) {
    case 'paid':
      return PaymentStatus.PAID;
    case 'no_payment_required':
      return PaymentStatus.NO_PAYMENT_REQUIRED;
    case 'unpaid':
    default:
      return PaymentStatus.UN_PAID;
  }
};

const isPaymentSettled = (paymentStatus: PaymentStatus) =>
  paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.NO_PAYMENT_REQUIRED;

/**
 * Main event handler - routes events to specific handlers
 */
export async function handleStripeEvent(event: Stripe.Event) {
  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      // ===== Checkout Events =====
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

      case 'checkout.session.async_payment_succeeded':
        return await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);

      case 'checkout.session.async_payment_failed':
        return await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);

      // ===== Invoice Events (Subscription renewals) =====
      case 'invoice.paid':
        return await handleInvoicePaid(event.data.object as Stripe.Invoice);

      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

      // ===== Subscription Events =====
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

      // ===== Payment Intent Events (One-time payments) =====
      case 'payment_intent.succeeded':
        console.log(`Payment Intent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
        // Usually handled by checkout.session.completed
        return;

      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

      // ===== Refund Events =====
      case 'charge.refunded':
        return await handleChargeRefunded(event.data.object as Stripe.Charge);

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    throw error;
  }
}

/**
 * Handle checkout.session.completed
 * Routes to subscription or one-time payment based on transaction type
 *
 * NOTE: For subscriptions, actual credit allocation happens in invoice.paid event
 * because subscription period details are not available in checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}`);

  // 1. Get transaction by session ID or order ID
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error('Missing order_id in session metadata');
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found: ${orderId}`);
  }

  if (transaction.orderStatus === OrderStatus.SUCCESS) {
    console.log(`Transaction already processed successfully: ${transaction.orderId}, skipping.`);
    return;
  }

  // Stripe docs: checkout.session.completed fires even when payment is pending for async methods
  // https://stripe.com/docs/payments/checkout/one-time#webhooks
  const paymentStatus = mapPaymentStatus(session.payment_status);

  if (!isPaymentSettled(paymentStatus)) {
    console.log(
      `Checkout session ${session.id} payment incomplete (status=${session.payment_status}), awaiting async confirmation.`
    );

    if (
      transaction.orderStatus === OrderStatus.CREATED ||
      transaction.orderStatus === OrderStatus.PENDING_UNPAID
    ) {
      await transactionService.updateStatus(orderId, OrderStatus.PENDING_UNPAID, {
        payUpdatedAt: new Date(),
        paymentStatus,
      });
    }
    return;
  }

  // 2. Route based on transaction type
  if (transaction.type === TransactionType.SUBSCRIPTION) {
    // For subscriptions, store session info and wait for invoice.paid
    return await handleSubscriptionCheckoutInit(session, transaction, paymentStatus);
  } else if (transaction.type === TransactionType.ONE_TIME) {
    return await handleOneTimeCheckout(session, transaction, paymentStatus);
  } else {
    throw new Error(`Unknown transaction type: ${transaction.type}`);
  }
}

/**
 * Handle subscription payment checkout [COMPLETE PROCESSING]
 *
 * REDESIGN: Now handles complete subscription setup in checkout phase.
 * Why? Stripe API provides complete subscription info immediately.
 *
 * ARCHITECTURE: API calls are performed BEFORE the database transaction to avoid:
 * - Long-lived database connections
 * - Transaction timeouts
 * - Connection pool exhaustion
 *
 * This function:
 * 1. Retrieves accurate subscription info from Stripe (includes billing period) - BEFORE transaction
 * 2. Creates/Updates Subscription record with full period information - IN transaction
 * 3. Updates Transaction with all payment details and FINAL status (SUCCESS) - IN transaction
 * 4. Allocates credits with correct billing period - IN transaction
 *
 * Result: invoice.paid event only needs to update invoice URLs and optionally create renewal records.
 */
async function handleSubscriptionCheckoutInit(
  session: Stripe.Checkout.Session,
  transaction: Transaction,
  paymentStatus: PaymentStatus
) {
  console.log(`Processing subscription checkout: ${session.id}`);

  // 1. Get subscription ID from session
  if (!session.subscription) {
    throw new Error('No subscription ID in checkout session');
  }

  const subscriptionId = session.subscription as string;

  // ===== STEP 1: FETCH EXTERNAL API DATA (BEFORE TRANSACTION) =====
  // 2. Get COMPLETE Stripe subscription details including billing period
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Extract billing period from subscription items (NOT from top-level subscription object)
  // The current_period_start/end are on SubscriptionItem, not on Subscription
  const subscriptionItem = stripeSubscription.items?.data?.[0];
  if (!subscriptionItem) {
    throw new Error(
      `No subscription items found for subscription ${subscriptionId}`
    );
  }

  const currentPeriodStart = subscriptionItem.current_period_start;
  const currentPeriodEnd = subscriptionItem.current_period_end;

  if (!currentPeriodStart || !currentPeriodEnd) {
    throw new Error(
      `Invalid subscription period from Stripe API: start=${currentPeriodStart}, end=${currentPeriodEnd}`
    );
  }

  // Log the Stripe API response with correct data structure
  const logId = await Apilogger.logStripeOutgoing(
    'stripe.subscriptions.retrieve',
    { subscriptionId },
    {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      subscription_item_count: stripeSubscription.items?.data?.length || 0,
    }
  );
  Apilogger.updateResponse(logId, stripeSubscription);

  const subPeriodStart = new Date(currentPeriodStart * 1000);
  const subPeriodEnd = new Date(currentPeriodEnd * 1000);

  // Validate dates
  if (isNaN(subPeriodStart.getTime()) || isNaN(subPeriodEnd.getTime())) {
    throw new Error(
      `Invalid date conversion: start=${subPeriodStart.toISOString()}, end=${subPeriodEnd.toISOString()}`
    );
  }

  console.log('Stripe subscription info:', {
    id: subscriptionId,
    status: stripeSubscription.status,
    periodStart: subPeriodStart.toISOString(),
    periodEnd: subPeriodEnd.toISOString(),
  });

  const updatedSubscription = await billingAggregateService.completeSubscriptionCheckout(
    {
      userId: transaction.userId,
      orderId: transaction.orderId,
      subscriptionId,
      stripeStatus: stripeSubscription.status,
      creditsGranted: transaction.creditsGranted || 0,
      priceId: transaction.priceId,
      priceName: transaction.priceName,
      periodStart: subPeriodStart,
      periodEnd: subPeriodEnd,
      paymentStatus,
      sessionId: session.id,
      paidEmail: session.customer_details?.email,
    }
  );

  console.log(`Subscription checkout completed: ${transaction.orderId}`);
  return updatedSubscription;
}

/**
 * Handle one-time payment checkout [FINAL EVENT]
 *
 * One-time payments complete in a single event (checkout.session.completed).
 * This is the FINAL event that sets orderStatus.
 */
async function handleOneTimeCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction,
  paymentStatus: PaymentStatus
) {
  console.log(`Processing one-time payment checkout: ${session.id}`);
  // 1. Calculate one-time credit expiration (1 year from purchase)
  const now = new Date();
  const oneTimePaidStart = now;
  const oneTimePaidEnd = new Date(now);
  oneTimePaidEnd.setDate(oneTimePaidEnd.getDate() + oneTimeExpiredDays);
  oneTimePaidEnd.setHours(23, 59, 59, 999);

  await billingAggregateService.completeOneTimeCheckout(
    {
      userId: transaction.userId,
      orderId: transaction.orderId,
      creditsGranted: transaction.creditsGranted || 0,
      paymentStatus,
      payTransactionId: session.payment_intent as string,
      paidEmail: session.customer_details?.email,
      oneTimePaidStart,
      oneTimePaidEnd,
    }
  );

  console.log(`One-time payment completed: ${transaction.orderId}`);
}

/**
 * Handle invoice.paid [SIMPLIFIED - Only for renewals and invoice tracking]
 *
 * REDESIGN: Now handles:
 * 1. Subscription renewals (billing_reason !== 'subscription_create')
 *    ├─ Updates Subscription with new period from invoice.lines[0].period
 *    ├─ Creates new renewal Transaction record
 *    ├─ Adds renewal credits
 *    └─ Stores invoice URLs
 *
 * 2. Initial subscription invoice (billing_reason === 'subscription_create')
 *    └─ Updates transaction with invoice URLs using metadata to find the order
 *
 * KEY IMPROVEMENT: Subscription metadata now contains order_id and user_id,
 * so we can directly retrieve transaction without needing to find subscription first.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  // ===== STEP 1: EXTRACT AND VALIDATE DATA FROM INVOICE (BEFORE TRANSACTION) =====
  // 1. Get subscription details from invoice parent
  const parentDetails = (invoice as any).parent?.subscription_details;
  if (!parentDetails?.subscription) {
    console.warn('Invoice not associated with subscription, skipping');
    return;
  }

  const subscriptionId = parentDetails.subscription;
  const subscriptionMetadata = parentDetails.metadata || {};

  // 2. Check billing reason to determine payment type
  const isInitialPayment = invoice.billing_reason === BillingReason.SUBSCRIPTION_CREATE;
  const isRenewal = invoice.billing_reason === BillingReason.SUBSCRIPTION_CYCLE;

  // Only handle initial payments and renewals
  if (!isInitialPayment && !isRenewal) {
    console.warn(`Unhandled invoice billing_reason: ${invoice.billing_reason}, skipping`);
    return;
  }

  // 3. Extract subscription period from invoice line items
  const lineItem = invoice.lines?.data?.[0];
  if (!lineItem) {
    throw new Error(`No line items found in invoice ${invoice.id}`);
  }

  const periodStart = (lineItem as any).period?.start;
  const periodEnd = (lineItem as any).period?.end;

  if (!periodStart || !periodEnd) {
    throw new Error(
      `Invalid period in invoice line: start=${periodStart}, end=${periodEnd}. Invoice ID: ${invoice.id}`
    );
  }

  const subPeriodStart = new Date(periodStart * 1000);
  const subPeriodEnd = new Date(periodEnd * 1000);

  // Validate dates
  if (isNaN(subPeriodStart.getTime()) || isNaN(subPeriodEnd.getTime())) {
    throw new Error(
      `Invalid date conversion: start=${subPeriodStart.toISOString()}, end=${subPeriodEnd.toISOString()}`
    );
  }

  console.log('Invoice info:', {
    invoiceId: invoice.id,
    subscriptionId,
    billingReason: invoice.billing_reason,
    isInitialPayment,
    periodStart: subPeriodStart.toISOString(),
    periodEnd: subPeriodEnd.toISOString(),
  });

  if (isInitialPayment) {
    const orderId = subscriptionMetadata.order_id;

    if (!orderId) {
      console.warn(
        `No order_id in subscription metadata for initial invoice ${invoice.id}. ` +
        `Skipping invoice URL update.`
      );
      return;
    }
    const transaction = await transactionService.findByOrderId(orderId);

    if (!transaction) {
      console.warn(`Transaction not found for order_id: ${orderId}`);
    } else {
      await billingAggregateService.recordInitialInvoiceDetails(
        {
          orderId: transaction.orderId,
          invoiceId: invoice.id,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          billingReason: invoice.billing_reason,
        }
      );

      console.log(`Initial invoice recorded for transaction: ${transaction.orderId}`);
    }

    console.log(`Invoice paid event completed, invoiceId: ${invoice.id}`);
    return;
  }

  if (isRenewal) {
    const renewalOrderId = `order_renew_${invoice.id}`;
    const existingOrder = await transactionService.findByOrderId(renewalOrderId);

    if (existingOrder) {
      console.log(`Renewal invoice ${invoice.id} already processed as ${existingOrder.orderId}, skipping.`);
      return;
    }

    // Find subscription to get user info
    const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription not found for renewal: ${subscriptionId}`);
    }

    // Get credits from current price configuration (handles plan upgrades/downgrades)
    const creditsForRenewal = subscription.priceId
      ? getCreditsFromPriceId(subscription.priceId)
      : subscription.creditsAllocated;

    const renewalCredits = creditsForRenewal || subscription.creditsAllocated;

    const paymentIntentId =
      typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id;

    await billingAggregateService.recordSubscriptionRenewalPayment(
      {
        subscription,
        renewalOrderId,
        invoiceId: invoice.id,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        billingReason: invoice.billing_reason,
        paymentIntentId,
        amountPaidCents: invoice.amount_paid,
        currency: invoice.currency,
        renewalCredits,
        periodStart: subPeriodStart,
        periodEnd: subPeriodEnd,
        paidAt: new Date(invoice.created * 1000),
      }
    );

    console.log(`Invoice renewal paid event completed, and invoiceId: ${invoice.id}, subscriptionId: ${subscription.id}, orderId: ${renewalOrderId}`);
    return;
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscriptionId = stripeSubscription.id;
  console.log(`Subscription deleted: ${subscriptionId}`);

  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${subscriptionId}`);
    return;
  }

  const userCanceledAt = stripeSubscription.canceled_at;
  if (!userCanceledAt) {
    throw new Error(
      `Invalid period in invoice line: canceldAt=${userCanceledAt}, subscriptionId=${subscriptionId}`
    );
  }

  const canceledAt =  new Date(userCanceledAt * 1000);
  
  const cancellationDetail = stripeSubscription.cancellation_details ? JSON.stringify(stripeSubscription.cancellation_details) : undefined;

  await billingAggregateService.processSubscriptionCancel(
    {
      subscription,
      canceledAt,
      cancellationDetail
    }
  );
  
  console.log(`Subscription status updated to canceled: ${subscription.id}`);
}

/**
 * Handle async payment succeeded
 */
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log(`Async payment succeeded: ${session.id}`);

  // Retrieve the latest session state to ensure payment_status is up to date
  const latestSession = await stripe.checkout.sessions.retrieve(session.id);

  return await handleCheckoutCompleted(latestSession);
}

/**
 * Handle async payment failed
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log(`Async payment failed: ${session.id}`);

  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    console.warn(`Transaction not found for async payment failure, orderId=${orderId}`);
    return;
  }

  if (transaction.orderStatus === OrderStatus.SUCCESS) {
    console.warn(
      `Received async payment failed for already successful order ${orderId}, ignoring.`
    );
    return;
  }

  await transactionService.updateStatus(orderId, OrderStatus.FAILED, {
    payUpdatedAt: new Date(),
    paymentStatus: PaymentStatus.UN_PAID,
  });
}

/**
 * Handle invoice payment failed
 *
 * ARCHITECTURE: Branch logic is outside transaction for clarity.
 * Each case (initial vs renewal) has its own transaction block.
 *
 * For initial payment failures: Use subscription metadata to find order_id
 * For renewal failures: Use subscription ID to find subscription, then user info
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment-failed event: ${invoice.id}`);

  const parentDetails = (invoice as any).parent?.subscription_details;
  if (!parentDetails?.subscription) {
    console.warn('Invoice not associated with subscription, skipping');
    return;
  }

  const subscriptionId = parentDetails.subscription;
  const subscriptionMetadata = parentDetails.metadata || {};
  const isInitialPayment = invoice.billing_reason === BillingReason.SUBSCRIPTION_CREATE;
  const isRenewal = invoice.billing_reason === BillingReason.SUBSCRIPTION_CYCLE;

  // Only handle initial payments and renewals
  if (!isInitialPayment && !isRenewal) {
    console.warn(`Unhandled invoice billing_reason: ${invoice.billing_reason}, skipping`);
    return;
  }

  // 支付ID
  const paymentIntentId =
      typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id;

  // ===== CASE 1: Initial subscription payment failed =====
  if (isInitialPayment) {
    const orderId = subscriptionMetadata.order_id;

    if (!orderId) {
      console.warn(
        `No order_id in subscription metadata for failed initial invoice ${invoice.id}. ` +
        `Skipping payment failure update.`
      );
      return;
    }

    const transaction = await transactionService.findByOrderId(orderId);

    if (!transaction) {
      console.warn(`Transaction not found for order_id: ${orderId}`);
    } else {
      await billingAggregateService.recordInitialPaymentFailure(
        {
          orderId: transaction.orderId,
          invoiceId: invoice.id,
          paymentIntentId: paymentIntentId,
          detail: 'Initial subscription payment failed',
        }
      );
      console.log(`Initial subscription payment-failed event updated for order: ${orderId}`);
    }
    // 返回, 增加代码阅读性
    return;
  }

  // ===== CASE 2: Subscription renewal payment failed =====
  if (isRenewal) {
    // For renewals, we need the subscription to get user info
    const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
    if (!subscription) {
      console.warn(`Subscription not found for renewal payment-failed event, and invoice ${invoice.id}`);
      return;
    }
    const failedOrderId = `order_renew_failed_${invoice.id}`;

    const existingFailureOrder = await transactionService.findByOrderId(failedOrderId);

    if (existingFailureOrder) {
      console.log(`Renewal payment-failure event for invoice ${invoice.id} already recorded as ${failedOrderId}, skipping.`);
      return;
    }

    await billingAggregateService.recordRenewalPaymentFailure(
      {
        subscription,
        failedOrderId,
        invoiceId: invoice.id,
        billingReason: invoice.billing_reason,
        paymentIntentId,
        amountDueCents: invoice.amount_due,
        currency: invoice.currency,
        createdAt: new Date(invoice.created * 1000),
      }
    );

    console.log(`Invoice renewal  payment-failed event completed,  and invoiceId: ${invoice.id}, recorded: ${subscription.id}, orderId: ${failedOrderId}`);
    return;
  }
  
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription created: ${stripeSubscription.id}`);
  // Usually handled by checkout.session.completed
}

/**
 * Handle subscription updated  TODO
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${stripeSubscription.id}`);

  // Extract period timestamps from subscription items (NOT from top-level subscription object)
  const subscriptionItem = stripeSubscription.items?.data?.[0];

  if (!subscriptionItem) {
    console.warn(`No subscription items found for ${stripeSubscription.id}, reject!`);
    return;
  }

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${stripeSubscription.id}`);
    return;
  }


  // Use period from subscription item if available
  const currentPeriodStart = subscriptionItem.current_period_start;
  const currentPeriodEnd = subscriptionItem.current_period_end;

  await billingAggregateService.syncSubscriptionFromStripe(
    {
      subscription,
      status: stripeSubscription.status,
      periodStart: new Date(currentPeriodStart * 1000),
      periodEnd: new Date(currentPeriodEnd * 1000),
    }
  );

  console.log(`Subscription updated in DB: ${subscription.id}`);
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent failed: ${paymentIntent.id}`);
  // Find transaction by payment intent ID
  const transaction = await transactionService.findByPayTransactionId(paymentIntent.id);
  if (transaction) {
    await transactionService.updateStatus(transaction.orderId, OrderStatus.FAILED, {
      paymentStatus: PaymentStatus.UN_PAID,
      payUpdatedAt: new Date(),
    });
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  // Find transaction by payment intent
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const transaction = await transactionService.findByPayTransactionId(paymentIntentId);
  if (!transaction) return;

  if (transaction.orderStatus === OrderStatus.REFUNDED) {
    console.log(`Transaction already marked refunded: ${transaction.orderId}, skipping.`);
    return;
  }

  if (transaction.type === TransactionType.SUBSCRIPTION) {
    const subscription = transaction.paySubscriptionId
      ? await subscriptionService.findByPaySubscriptionId(transaction.paySubscriptionId)
      : null;

    await billingAggregateService.processSubscriptionRefund(
      {
        transaction,
        subscription,
      }
    );

    console.log(`Subscription refund processed for transaction: ${transaction.orderId}`);
    return;
  }

  if (transaction.type === TransactionType.ONE_TIME) {
    await billingAggregateService.processOneTimeRefund({ transaction });

    console.log(`One-time refund processed for transaction: ${transaction.orderId}`);
    return;
  }
  // for other type, not available
  await transactionService.update(
    transaction.orderId,
    {
      orderStatus: OrderStatus.REFUNDED,
      paymentStatus: PaymentStatus.UN_PAID,
      payUpdatedAt: new Date(),
    }
  );

  console.log(`Refund processed for transaction without credit adjustments: ${transaction.orderId}`);
}
