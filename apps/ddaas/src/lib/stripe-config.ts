import Stripe from 'stripe';
import { Apilogger } from '@/db/index';

// Stripe Configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Webhook Configuration
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
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

// Helper function to create checkout session
export const createCheckoutSession = async (params: {
  priceId: string;
  customerId?: string;
  clientReferenceId: string; // user_id
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> => {
  const { priceId, customerId, clientReferenceId, successUrl, cancelUrl, metadata } = params;
  
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
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
    metadata,
  };

  // TODO: 暂时不支持一次性付费方式

  // 如果有客户ID，添加到session
  if (customerId) {
    sessionParams.customer = customerId;
  }

  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('createCheckoutSession', params);
  
  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      session_id: session.id,
      url: session.url
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