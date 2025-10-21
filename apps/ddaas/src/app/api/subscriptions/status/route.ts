/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe-config';
import { 
  subscriptionService,
  creditService,
  SubscriptionStatus 
} from '@/services/database';
import { ApiAuthUtils } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // 使用统一认证工具获取用户信息（避免重复查询）
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // Get user's subscriptions
    const subscriptions = await subscriptionService.findByUserId(user.userId);
    
    // Get user's credits
    const credits = await creditService.getCredit(user.userId);

    // Process subscription data
    const subscriptionData = await Promise.all(
      subscriptions.map(async (sub) => {
        let stripeSubscription = null;
        
        // Get detailed info from Stripe if subscription is active
        if (sub.paySubscriptionId && sub.status === SubscriptionStatus.ACTIVE) {
          try {
            stripeSubscription = await stripe.subscriptions.retrieve(sub.paySubscriptionId);
          } catch (error) {
            console.warn('Failed to retrieve Stripe subscription:', sub.paySubscriptionId, error);
          }
        }

        return {
          id: sub.id,
          paySubscriptionId: sub.paySubscriptionId,
          priceId: sub.priceId,
          priceName: sub.priceName,
          status: sub.status,
          creditsAllocated: sub.creditsAllocated,
          periodStart: sub.subPeriodStart,
          periodEnd: sub.subPeriodEnd,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          // Stripe subscription details
          stripeStatus: stripeSubscription?.status,
          currentPeriodStart: stripeSubscription ? new Date((stripeSubscription as any).current_period_start * 1000) : null,
          currentPeriodEnd: stripeSubscription ? new Date((stripeSubscription as any).current_period_end * 1000) : null,
          cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end,
          trialEnd: stripeSubscription?.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        };
      })
    );

    // Find active subscription
    const activeSubscription = subscriptionData.find(sub => 
      sub.status === SubscriptionStatus.ACTIVE || sub.stripeStatus === 'active'
    );

    // Calculate subscription summary
    const subscriptionSummary = {
      hasActiveSubscription: !!activeSubscription,
      currentPlan: activeSubscription ? {
        name: activeSubscription.priceName,
        priceId: activeSubscription.priceId,
        creditsPerMonth: activeSubscription.creditsAllocated,
        status: activeSubscription.status,
        periodStart: activeSubscription.currentPeriodStart || activeSubscription.periodStart,
        periodEnd: activeSubscription.currentPeriodEnd || activeSubscription.periodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      } : null,
      totalSubscriptions: subscriptions.length,
    };

    // Calculate credits summary
    const creditsSummary = credits ? {
      balanceFree: credits.balanceFree,
      balancePaid: credits.balancePaid,
      totalBalance: credits.balanceFree + credits.balancePaid,
      totalFreeLimit: credits.totalFreeLimit,
      totalPaidLimit: credits.totalPaidLimit,
      updatedAt: credits.updatedAt,
    } : {
      balanceFree: 0,
      balancePaid: 0,
      totalBalance: 0,
      totalFreeLimit: 0,
      totalPaidLimit: 0,
      updatedAt: null,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          status: user.status,
          isRegistered: !!user.email && !!user.clerkUserId,
        },
        subscription: subscriptionSummary,
        credits: creditsSummary,
        subscriptions: subscriptionData,
      },
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}