import Stripe from 'stripe';
import { Apilogger } from '@/db/index';

// Stripe Configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Webhook Configuration
export const STRIPE_WEBHOOK_EVENTS = [
  // Checkout events (both subscription and one-time payment)
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',

  // Invoice events (subscription only)
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',

  // Subscription events
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',

  // Payment Intent events (one-time payment only)
  'payment_intent.succeeded',
  'payment_intent.payment_failed',

  // Refund events
  'charge.refunded',
] as const;

// Helper function to validate webhook signature
export const validateStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  clientReferenceId: string; // user_id
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  // ✅ New: Auto-determine mode based on interval
  interval?: string; // 'month' | 'year' | 'onetime' | undefined
  // ✅ New: Subscription metadata for webhook processing
  subscriptionData?: Stripe.Checkout.SessionCreateParams.SubscriptionData;
}

// Helper function to create checkout session
export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> => {
  const {
    priceId,
    customerId,
    clientReferenceId,
    successUrl,
    cancelUrl,
    metadata,
    subscriptionData,
    interval
  } = params;

  // ✅ Dynamic mode determination: subscription if interval is not 'onetime'
  const mode: 'subscription' | 'payment' =
    interval && interval !== 'onetime' ? 'subscription' : 'payment';

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode, // ✅ Dynamic mode
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: clientReferenceId,
    metadata: {
      ...metadata,
      mode, // Record mode for webhook processing
    },
    // 在这里注入订单元数据，以保证后续事件处理能根据订单去匹配处理
    subscription_data: subscriptionData
  };

  // Add customer if provided
  if (customerId) {
    sessionParams.customer = customerId;
  }

  // One-time payment specific configuration
  if (mode === 'payment') {
    sessionParams.invoice_creation = {
      enabled: false, // One-time payments don't create invoices
    };
  }

  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('createCheckoutSession', params);

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update log record with response
    Apilogger.updateResponse(logId, {
      session_id: session.id,
      url: session.url,
      mode: session.mode
    });

    return session;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Helper function to create or retrieve customer
export const createOrGetCustomer = async (params: {
  email?: string;
  userId: string;
  name?: string;
}): Promise<Stripe.Customer> => {
  const { email, userId, name } = params;

  // 先尝试查找现有客户
  if (email) {
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }
  }

  // 创建新客户
  const customerParams: Stripe.CustomerCreateParams = {
    metadata: {
      user_id: userId,
    },
  };

  if (email) {
    customerParams.email = email;
  }

  if (name) {
    customerParams.name = name;
  }

  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('createCustomer', params);
  
  try {
    const customer = await stripe.customers.create(customerParams);
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      customer_id: customer.id,
      email: customer.email
    });
    
    return customer;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Helper function to update subscription
export const updateSubscription = async (params: {
  subscriptionId: string;
  priceId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}): Promise<Stripe.Subscription> => {
  const { subscriptionId, priceId, prorationBehavior = 'create_prorations' } = params;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('updateSubscription', params);
  
  try {
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      subscription_id: updatedSubscription.id,
      status: updatedSubscription.status
    });
    
    return updatedSubscription;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Helper function to cancel subscription
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> => {
  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('cancelSubscription', {
    subscriptionId,
    cancelAtPeriodEnd
  });
  
  try {
    let result: Stripe.Subscription;
    
    if (cancelAtPeriodEnd) {
      result = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      result = await stripe.subscriptions.cancel(subscriptionId);
    }
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      subscription_id: result.id,
      status: result.status,
      cancel_at_period_end: result.cancel_at_period_end
    });
    
    return result;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};