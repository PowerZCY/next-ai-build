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
 * - All credit operations use upsert() for idempotency
 * - No race conditions on orderStatus (already SUCCESS before invoice.paid)
 * - Safe for webhook replay
 */

import Stripe from 'stripe';
import { PrismaClient, Prisma } from '@prisma/client';
import { stripe } from '@/lib/stripe-config';
import { getCreditsFromPriceId } from '@/lib/money-price-config';
import {
  transactionService,
  subscriptionService,
  Transaction,
  TransactionType,
  OrderStatus,
  SubscriptionStatus,
  CreditType,
  OperationType,
  PaySupplier,
  BillingReason,
  PaymentStatus,
} from '@/services/database';
import { Apilogger } from '@/services/database/apilog.service';
import { oneTimeExpiredDays } from '@/lib/appConfig';

const prisma = new PrismaClient();

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

  // ===== STEP 2: DATABASE TRANSACTION (WITH PREPARED DATA) =====
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 3. Find and UPDATE the placeholder subscription record (initialized during user registration)
    // This ensures consistent logic: all subscription scenarios use UPDATE, not CREATE
    const existingSubscription = await tx.subscription.findFirst({
      where: {
        userId: transaction.userId,
        status: SubscriptionStatus.INCOMPLETE, // ← placeholder status
      },
    });

    if (!existingSubscription) {
      throw new Error(
        `Subscription placeholder not found OR Repeat for user ${transaction.userId}. `
      );
    }

    const subscription = await tx.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        paySubscriptionId: subscriptionId,
        priceId: transaction.priceId || undefined,
        priceName: transaction.priceName || undefined,
        status: stripeSubscription.status,
        creditsAllocated: transaction.creditsGranted || 0,
        subPeriodStart, // ✅ SET from Stripe API
        subPeriodEnd,   // ✅ SET from Stripe API
        updatedAt: new Date(),
      },
    });

    console.log(`Updated subscription placeholder with period info: ${subscription.id}`);

    // 4. Update Transaction with COMPLETE payment info and FINAL status
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS, // ✅ FINAL STATUS SET HERE
        paymentStatus,
        paySubscriptionId: subscriptionId,
        paySessionId: session.id,
        paidEmail: session.customer_details?.email,
        paidAt: new Date(),
        payUpdatedAt: new Date(),
      },
    });

    console.log(`Transaction marked SUCCESS: ${transaction.orderId}`);

    // 5. Update subscription credits with correct billing period
    await tx.credit.upsert({
      where: { userId: transaction.userId },
      update: {
        balancePaid: { increment: transaction.creditsGranted || 0 },
        totalPaidLimit: { increment: transaction.creditsGranted || 0 },
        paidStart: subPeriodStart,
        paidEnd: subPeriodEnd,
      },
      create: {
        userId: transaction.userId,
        balancePaid: transaction.creditsGranted || 0,
        totalPaidLimit: transaction.creditsGranted || 0,
        paidStart: subPeriodStart,
        paidEnd: subPeriodEnd,
      },
    } as any);

    console.log(`Credits allocated for subscription: ${transaction.creditsGranted}`);

    // 6. Record credit usage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: TransactionType.SUBSCRIPTION,
        orderId: transaction.orderId,
        creditType: CreditType.PAID,
        operationType: OperationType.RECHARGE,
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`Subscription checkout completed: ${transaction.orderId}`);
    return subscription;
  });
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

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update Transaction with payment info and FINAL status
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS, // ✅ FINAL STATUS SET HERE
        paymentStatus,
        payTransactionId: session.payment_intent as string,
        paidAt: new Date(),
        paidEmail: session.customer_details?.email,
        payUpdatedAt: new Date(),
      },
    });

    // 2. Calculate one-time credit expiration (1 year from purchase)
    const now = new Date();
    const oneTimePaidStart = now;
    const oneTimePaidEnd = new Date(now);
    oneTimePaidEnd.setDate(oneTimePaidEnd.getDate() + oneTimeExpiredDays);
    oneTimePaidEnd.setHours(23, 59, 59, 999);

    // 3. Update one-time purchase credits (or create if not exists)
    await tx.credit.upsert({
      where: { userId: transaction.userId },
      update: {
        balanceOneTimePaid: { increment: transaction.creditsGranted || 0 },
        totalOneTimePaidLimit: { increment: transaction.creditsGranted || 0 },
        oneTimePaidStart,
        oneTimePaidEnd,
      },
      create: {
        userId: transaction.userId,
        balanceOneTimePaid: transaction.creditsGranted || 0,
        totalOneTimePaidLimit: transaction.creditsGranted || 0,
        oneTimePaidStart,
        oneTimePaidEnd,
      },
    } as any);

    // 4. Record credit usage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: TransactionType.ONE_TIME,
        orderId: transaction.orderId,
        creditType: CreditType.PAID,
        operationType: OperationType.RECHARGE,
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`One-time payment completed: ${transaction.orderId}`);
  });
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

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find transaction by order ID (created in session.completed)
      const transaction = await tx.transaction.findUnique({
        where: { orderId },
      });

      if (transaction) {
        // Update transaction with invoice URLs and billing reason for record keeping
        await tx.transaction.update({
          where: { orderId: transaction.orderId },
          data: {
            payInvoiceId: invoice.id,
            hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
            invoicePdf: invoice.invoice_pdf || undefined,
            billingReason: invoice.billing_reason || undefined,
            payUpdatedAt: new Date(),
          },
        });

        console.log(`Initial invoice recorded for transaction: ${transaction.orderId}`);
      } else {
        console.warn(`Transaction not found for order_id: ${orderId}`);
      }
    });

    console.log(`Invoice paid event completed: ${invoice.id}`);
    return;
  }

  if (isRenewal) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find subscription to get user info
      const subscription = await tx.subscription.findFirst({
        where: { paySubscriptionId: subscriptionId },
      });

      if (!subscription) {
        throw new Error(`Subscription not found for renewal: ${subscriptionId}`);
      }

      // Update subscription with new period
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          subPeriodStart,
          subPeriodEnd,
          updatedAt: new Date(),
        },
      });

      // Create new renewal transaction record
      const renewalOrderId = `order_renew_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Get credits from current price configuration (handles plan upgrades/downgrades)
      const creditsForRenewal = subscription.priceId
        ? getCreditsFromPriceId(subscription.priceId)
        : subscription.creditsAllocated;

      const renewalCredits = creditsForRenewal || subscription.creditsAllocated;

      await tx.transaction.create({
        data: {
          userId: subscription.userId,
          orderId: renewalOrderId,
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: PaymentStatus.PAID,
          paySupplier: PaySupplier.STRIPE,
          paySubscriptionId: subscriptionId,
          payInvoiceId: invoice.id,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
          billingReason: invoice.billing_reason || undefined,
          payTransactionId: typeof (invoice as any).payment_intent === 'string'
            ? (invoice as any).payment_intent
            : (invoice as any).payment_intent?.id,
          priceId: subscription.priceId,
          priceName: subscription.priceName,
          type: TransactionType.SUBSCRIPTION,
          amount: invoice.amount_paid / 100, // Convert cents to dollars
          currency: invoice.currency.toUpperCase(),
          creditsGranted: renewalCredits,
          paidAt: new Date(invoice.created * 1000),
          payUpdatedAt: new Date(),
        },
      });

      // Update subscription credits for renewal
      await tx.credit.upsert({
        where: { userId: subscription.userId },
        update: {
          balancePaid: { increment: renewalCredits },
          totalPaidLimit: { increment: renewalCredits },
          paidStart: subPeriodStart,
          paidEnd: subPeriodEnd,
        },
        create: {
          userId: subscription.userId,
          balancePaid: renewalCredits,
          totalPaidLimit: renewalCredits,
          paidStart: subPeriodStart,
          paidEnd: subPeriodEnd,
        },
      } as any);

      // Record renewal credit usage
      await tx.creditUsage.create({
        data: {
          userId: subscription.userId,
          feature: `${TransactionType.SUBSCRIPTION}_renewal`,
          orderId: renewalOrderId,
          creditType: CreditType.PAID,
          operationType: OperationType.RECHARGE,
          creditsUsed: renewalCredits,
        },
      });

      console.log(`Subscription renewal processed: ${subscription.id}`);
    });

    console.log(`Invoice paid event completed: ${invoice.id}`);
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${stripeSubscription.id}`);

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${stripeSubscription.id}`);
    return;
  }

  await subscriptionService.updateStatus(subscription.id, SubscriptionStatus.CANCELED);
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
  console.log(`Invoice payment failed: ${invoice.id}`);

  const parentDetails = (invoice as any).parent?.subscription_details;
  if (!parentDetails?.subscription) {
    console.warn('Invoice not associated with subscription, skipping');
    return;
  }

  const subscriptionId = parentDetails.subscription;
  const subscriptionMetadata = parentDetails.metadata || {};
  const isInitialPayment = invoice.billing_reason === BillingReason.SUBSCRIPTION_CREATE;

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

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find transaction by order ID (created in session.completed or earlier)
      const transaction = await tx.transaction.findUnique({
        where: { orderId },
      });

      if (transaction) {
        // Update the original transaction to FAILED status
        await tx.transaction.update({
          where: { orderId: transaction.orderId },
          data: {
            orderStatus: OrderStatus.FAILED,
            paymentStatus: PaymentStatus.UN_PAID,
            payInvoiceId: invoice.id,
            payUpdatedAt: new Date(),
            orderDetail: 'Initial subscription payment failed',
          },
        });

        console.log(`Initial subscription payment failed for order: ${orderId}`);
      } else {
        console.warn(`Transaction not found for order_id: ${orderId}`);
      }
    });
  }

  // ===== CASE 2: Subscription renewal payment failed =====
  // For renewals, we need the subscription to get user info
  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) {
    console.warn(`Subscription not found for failed renewal invoice: ${subscriptionId}`);
    return;
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create failed renewal transaction record for tracking
    const failedOrderId = `order_renew_failed_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        orderId: failedOrderId,
        orderStatus: OrderStatus.FAILED,
        paymentStatus: PaymentStatus.UN_PAID,
        paySupplier: PaySupplier.STRIPE,
        paySubscriptionId: subscriptionId,
        payInvoiceId: invoice.id,
        billingReason: invoice.billing_reason || undefined,
        payTransactionId: typeof (invoice as any).payment_intent === 'string'
          ? (invoice as any).payment_intent
          : (invoice as any).payment_intent?.id,
        priceId: subscription.priceId,
        priceName: subscription.priceName,
        type: TransactionType.SUBSCRIPTION,
        amount: invoice.amount_due / 100, // Convert cents to dollars
        currency: invoice.currency.toUpperCase(),
        creditsGranted: 0, // No credits granted on failed payment
        paidAt: new Date(invoice.created * 1000),
        payUpdatedAt: new Date(),
        orderDetail: 'Subscription renewal payment failed',
      },
    });

    // Record failed renewal in credit usage for audit trail
    await tx.creditUsage.create({
      data: {
        userId: subscription.userId,
        feature: `${TransactionType.SUBSCRIPTION}_renewal_failed`,
        orderId: failedOrderId,
        creditType: CreditType.PAID,
        operationType: OperationType.RECHARGE,
        creditsUsed: 0, // Mark as failed operation
      },
    });

    // Update subscription status to past_due
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        updatedAt: new Date(),
      },
    });

    console.log(`Subscription renewal failed and recorded: ${subscription.id}, orderId: ${failedOrderId}`);
    console.log(`Invoice payment failed event completed: ${invoice.id}`);
  });
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

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${stripeSubscription.id}`);
    return;
  }

  // Extract period timestamps from subscription items (NOT from top-level subscription object)
  const subscriptionItem = stripeSubscription.items?.data?.[0];

  let currentPeriodStart: number;
  let currentPeriodEnd: number;

  if (subscriptionItem) {
    // Use period from subscription item if available
    currentPeriodStart = subscriptionItem.current_period_start;
    currentPeriodEnd = subscriptionItem.current_period_end;
  } else {
    // Fallback if no items found (should not happen in normal cases)
    console.warn(`No subscription items found for ${stripeSubscription.id}, using current time as fallback`);
    currentPeriodStart = Math.floor(Date.now() / 1000);
    currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  }

  // Update subscription status and period
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: stripeSubscription.status,
      subPeriodStart: new Date(currentPeriodStart * 1000),
      subPeriodEnd: new Date(currentPeriodEnd * 1000),
      updatedAt: new Date(),
    },
  });

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

  await prisma.$transaction(async (tx) => {
    // Update transaction status
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: { orderStatus: OrderStatus.REFUNDED },
    });

    // Deduct credits based on transaction type
    if (transaction.type === TransactionType.SUBSCRIPTION) {
      await tx.credit.upsert({
        where: { userId: transaction.userId },
        update: {
          balancePaid: { decrement: transaction.creditsGranted || 0 },
        },
        create: {
          userId: transaction.userId,
          balancePaid: -(transaction.creditsGranted || 0),
        },
      } as any);
    } else if (transaction.type === TransactionType.ONE_TIME) {
      await tx.credit.upsert({
        where: { userId: transaction.userId },
        update: {
          balanceOneTimePaid: { decrement: transaction.creditsGranted || 0 },
        },
        create: {
          userId: transaction.userId,
          balanceOneTimePaid: -(transaction.creditsGranted || 0),
        },
      } as any);
    }

    // Record credit deduction
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: OrderStatus.REFUNDED,
        orderId: transaction.orderId,
        creditType: CreditType.PAID,
        operationType: OperationType.CONSUME,
        creditsUsed: -(transaction.creditsGranted || 0), // Negative to indicate deduction
      },
    });
  });

  console.log(`Refund processed for transaction: ${transaction.orderId}`);
}
