import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { validateStripeWebhook } from '@/lib/stripe-config';
import Stripe from 'stripe';
import { Apilogger } from '@/db/index';
import { handleStripeEvent } from '@/services/stripe/webhook-handler';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw request body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // 2. Validate webhook signature
    const event = validateStripeWebhook(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received webhook event: ${event.type} | ID: ${event.id}`);

    // 3. Log incoming webhook
    await Apilogger.logStripeIncoming(event.type, event);

    // 4. Handle the event
    await handleStripeEvent(event);

    // 5. Return success response
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
