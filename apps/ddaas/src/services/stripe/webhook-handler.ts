/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import { PrismaClient, Prisma } from '@prisma/client';
import { stripe } from '@/lib/stripe-config';
import {
  transactionService,
  subscriptionService,
  TransactionType,
  OrderStatus,
  Transaction,
} from '@/services/database';

const prisma = new PrismaClient();

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

  // 2. Route based on transaction type
  if (transaction.type === TransactionType.SUBSCRIPTION) {
    return await handleSubscriptionCheckout(session, transaction);
  } else if (transaction.type === TransactionType.ONE_TIME) {
    return await handleOneTimeCheckout(session, transaction);
  } else {
    throw new Error(`Unknown transaction type: ${transaction.type}`);
  }
}

/**
 * Handle subscription payment checkout
 * Creates Subscription record and updates subscription credits
 */
async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction
) {
  console.log(`Processing subscription checkout: ${session.id}`);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Get Stripe subscription details
    if (!session.subscription) {
      throw new Error('No subscription ID in checkout session');
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
      { expand: ['items.data.price'] }
    );

    // 2. Get subscription period from Stripe
    const subPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
    const subPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);

    // 3. Create Subscription record
    const subscription = await tx.subscription.create({
      data: {
        userId: transaction.userId,
        paySubscriptionId: stripeSubscription.id,
        priceId: transaction.priceId || undefined,
        priceName: transaction.priceName || undefined,
        status: stripeSubscription.status,
        creditsAllocated: transaction.creditsGranted || 0,
        subPeriodStart,
        subPeriodEnd,
      },
    });

    console.log(`Created subscription: ${subscription.id}`);

    // 4. Update Transaction status
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
        paySubscriptionId: stripeSubscription.id,
        payTransactionId: session.payment_intent as string,
        subPeriodStart,
        subPeriodEnd,
        paidAt: new Date(),
        paidEmail: session.customer_details?.email,
        payUpdatedAt: new Date(),
      },
    });

    // 5. Update subscription credits with expiration
    await tx.credit.update({
      where: { userId: transaction.userId },
      data: {
        balancePaid: { increment: transaction.creditsGranted || 0 },
        totalPaidLimit: { increment: transaction.creditsGranted || 0 },
        paidStart: subPeriodStart, // ✅ Subscription credit expiration = subscription period
        paidEnd: subPeriodEnd,
      } as any,
    });

    // 6. Record credit usage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'subscription',
        orderId: transaction.orderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`Subscription checkout completed: ${transaction.orderId}`);
    return subscription;
  });
}

/**
 * Handle one-time payment checkout
 * Updates one-time purchase credits with 1-year expiration
 */
async function handleOneTimeCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction
) {
  console.log(`Processing one-time payment checkout: ${session.id}`);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update Transaction status
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
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
    oneTimePaidEnd.setDate(oneTimePaidEnd.getDate() + 365);
    oneTimePaidEnd.setHours(23, 59, 59, 999);

    // 3. Update one-time purchase credits
    await tx.credit.update({
      where: { userId: transaction.userId },
      data: {
        balanceOneTimePaid: { increment: transaction.creditsGranted || 0 },
        totalOneTimePaidLimit: { increment: transaction.creditsGranted || 0 },
        oneTimePaidStart,
        oneTimePaidEnd, // ✅ Fixed 1-year expiration
      } as any,
    });

    // 4. Record credit usage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'credit_pack',
        orderId: transaction.orderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`One-time payment completed: ${transaction.orderId}`);
  });
}

/**
 * Handle invoice.paid - Subscription renewal
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  // 1. Get subscription ID
  const subscriptionId = typeof (invoice as any).subscription === 'string'
    ? (invoice as any).subscription
    : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    console.warn('Invoice not associated with subscription, skipping');
    return;
  }

  // 2. Check if this is initial payment (already handled in checkout.session.completed)
  const isInitialPayment = invoice.billing_reason === 'subscription_create';
  if (isInitialPayment) {
    console.log('Initial payment, already handled in checkout.session.completed');
    return;
  }

  // 3. Find subscription record
  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  // 4. Process renewal
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 4.1 Get new billing period from invoice
    const newSubPeriodStart = new Date(invoice.period_start * 1000);
    const newSubPeriodEnd = new Date(invoice.period_end * 1000);

    // 4.2 Update Subscription record
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        subPeriodStart: newSubPeriodStart,
        subPeriodEnd: newSubPeriodEnd,
        updatedAt: new Date(),
      },
    });

    // 4.3 Create renewal transaction record
    const renewalOrderId = `order_renew_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        orderId: renewalOrderId,
        orderStatus: OrderStatus.SUCCESS,
        paySupplier: 'Stripe',
        paySubscriptionId: subscriptionId,
        payInvoiceId: invoice.id,
        payTransactionId: typeof (invoice as any).payment_intent === 'string'
          ? (invoice as any).payment_intent
          : (invoice as any).payment_intent?.id,
        priceId: subscription.priceId,
        priceName: subscription.priceName,
        type: TransactionType.SUBSCRIPTION,
        amount: invoice.amount_paid / 100, // Convert cents to dollars
        currency: invoice.currency.toUpperCase(),
        creditsGranted: subscription.creditsAllocated,
        subPeriodStart: newSubPeriodStart,
        subPeriodEnd: newSubPeriodEnd,
        paidAt: new Date(invoice.created * 1000),
        payUpdatedAt: new Date(),
      },
    });

    // 4.4 Update subscription credits and expiration
    await tx.credit.update({
      where: { userId: subscription.userId },
      data: {
        balancePaid: { increment: subscription.creditsAllocated },
        totalPaidLimit: { increment: subscription.creditsAllocated },
        paidStart: newSubPeriodStart, // ✅ Update to new period
        paidEnd: newSubPeriodEnd,
      } as any,
    });

    // 4.5 Record credit usage
    await tx.creditUsage.create({
      data: {
        userId: subscription.userId,
        feature: 'subscription_renewal',
        orderId: renewalOrderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: subscription.creditsAllocated,
      },
    });

    console.log(`Subscription renewed: ${subscription.id}`);
  });
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

  await subscriptionService.updateStatus(subscription.id, 'canceled');
  console.log(`Subscription status updated to canceled: ${subscription.id}`);
}

/**
 * Handle async payment succeeded
 */
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log(`Async payment succeeded: ${session.id}`);
  // Similar to checkout.session.completed
  return await handleCheckoutCompleted(session);
}

/**
 * Handle async payment failed
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log(`Async payment failed: ${session.id}`);

  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  await transactionService.updateStatus(orderId, OrderStatus.FAILED);
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);

  const subscriptionId = typeof (invoice as any).subscription === 'string'
    ? (invoice as any).subscription
    : (invoice as any).subscription?.id;

  if (!subscriptionId) return;

  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) return;

  await subscriptionService.updateStatus(subscription.id, 'past_due');
  console.log(`Subscription status updated to past_due: ${subscription.id}`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription created: ${stripeSubscription.id}`);
  // Usually handled by checkout.session.completed
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${stripeSubscription.id}`);

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${stripeSubscription.id}`);
    return;
  }

  // Safely extract period timestamps
  const currentPeriodStart = (stripeSubscription as any).current_period_start ||
    Math.floor(Date.now() / 1000);
  const currentPeriodEnd = (stripeSubscription as any).current_period_end ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

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
    await transactionService.updateStatus(transaction.orderId, OrderStatus.FAILED);
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
      await tx.credit.update({
        where: { userId: transaction.userId },
        data: {
          balancePaid: { decrement: transaction.creditsGranted || 0 },
        } as any,
      });
    } else if (transaction.type === TransactionType.ONE_TIME) {
      await tx.credit.update({
        where: { userId: transaction.userId },
        data: {
          balanceOneTimePaid: { decrement: transaction.creditsGranted || 0 },
        } as any,
      });
    }

    // Record credit deduction
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'refund',
        orderId: transaction.orderId,
        creditType: 'paid',
        operationType: 'consume',
        creditsUsed: -(transaction.creditsGranted || 0), // Negative to indicate deduction
      },
    });
  });

  console.log(`Refund processed for transaction: ${transaction.orderId}`);
}
