/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  transactionService,
  OrderStatus,
  TransactionType 
} from '@/services/database';
import { ApiAuthUtils } from '@/lib/auth-utils';

// Query parameters schema
const transactionHistoryQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  orderStatus: z.enum([OrderStatus.CREATED, OrderStatus.SUCCESS, OrderStatus.REFUNDED, OrderStatus.CANCELED, OrderStatus.FAILED]).optional(),
  transactionType: z.enum([TransactionType.SUBSCRIPTION, TransactionType.ONE_TIME]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const orderStatus = searchParams.get('orderStatus') as OrderStatus | undefined;
    const transactionType = searchParams.get('transactionType') as TransactionType | undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate parameters
    const params = transactionHistoryQuerySchema.parse({
      page,
      limit,
      orderStatus,
      transactionType,
      startDate,
      endDate,
    });

    // 使用统一认证工具获取用户信息（避免重复查询）
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // Build filters
    const filters: any = {};
    if (params.orderStatus) filters.orderStatus = params.orderStatus;
    if (params.transactionType) filters.type = params.transactionType;
    if (params.startDate) filters.startDate = new Date(params.startDate);
    if (params.endDate) filters.endDate = new Date(params.endDate);

    // Get transaction history with pagination
    const skip = (params.page - 1) * params.limit;
    const result = await transactionService.findByUserId(user.userId, {
      orderStatus: params.orderStatus,
      type: params.transactionType,
      skip,
      take: params.limit,
      orderBy: { orderCreatedAt: 'desc' },
    });

    const { transactions, total: totalCount } = result;

    // Process transaction data
    const processedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      orderId: transaction.orderId,
      orderStatus: transaction.orderStatus,
      orderCreatedAt: transaction.orderCreatedAt,
      orderUpdatedAt: transaction.orderUpdatedAt,
      
      // Payment details
      paySupplier: transaction.paySupplier,
      payTransactionId: transaction.payTransactionId,
      paySubscriptionId: transaction.paySubscriptionId,
      paySessionId: transaction.paySessionId,
      payInvoiceId: transaction.payInvoiceId,
      
      // Product details
      priceId: transaction.priceId,
      priceName: transaction.priceName,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      creditsGranted: transaction.creditsGranted,
      
      // Subscription details (if applicable)
      subPeriodStart: transaction.subPeriodStart,
      subPeriodEnd: transaction.subPeriodEnd,
      subIntervalCount: transaction.subIntervalCount,
      
      // Additional info
      orderDetail: transaction.orderDetail,
      paidAt: transaction.paidAt,
      paidEmail: transaction.paidEmail,
      
      // Metadata
      payUpdatedAt: transaction.payUpdatedAt,
      
      // Generate status display info
      statusDisplay: generateStatusDisplay(transaction),
      
      // Generate description
      description: generateTransactionDescription(transaction),
    }));

    // Calculate summary statistics
    const summary = calculateTransactionSummary(transactions);

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPrevPage = params.page > 1;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          status: user.status,
          isRegistered: !!user.email && !!user.clerkUserId,
        },
        transactions: processedTransactions,
        summary,
        pagination: {
          page: params.page,
          limit: params.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          orderStatus: params.orderStatus,
          transactionType: params.transactionType,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get transaction history' },
      { status: 500 }
    );
  }
}

// Helper function to generate status display information
function generateStatusDisplay(transaction: any) {
  const { orderStatus } = transaction;
  
  const statusMap = {
    [OrderStatus.CREATED]: {
      text: '等待支付',
      color: 'orange',
      description: '订单已创建，等待支付完成',
    },
    [OrderStatus.SUCCESS]: {
      text: '支付成功',
      color: 'green',
      description: '支付已完成，积分已到账',
    },
    [OrderStatus.REFUNDED]: {
      text: '已退款',
      color: 'blue',
      description: '订单已退款',
    },
    [OrderStatus.CANCELED]: {
      text: '已取消',
      color: 'gray',
      description: '订单已取消',
    },
    [OrderStatus.FAILED]: {
      text: '支付失败',
      color: 'red',
      description: '支付失败，请重试',
    },
  };

  return statusMap[orderStatus as keyof typeof statusMap] || {
    text: orderStatus,
    color: 'gray',
    description: `状态: ${orderStatus}`,
  };
}

// Helper function to generate transaction description
function generateTransactionDescription(transaction: any): string {
  const { type, priceName, creditsGranted, amount, currency } = transaction;
  
  if (type === TransactionType.SUBSCRIPTION) {
    return `订阅 ${priceName} - ${creditsGranted} 积分/月`;
  } else if (type === TransactionType.ONE_TIME) {
    return `购买 ${priceName} - ${creditsGranted} 积分`;
  } else {
    return `${priceName} - ¥${amount} ${currency?.toUpperCase()}`;
  }
}

// Helper function to calculate transaction summary
function calculateTransactionSummary(transactions: any[]) {
  const summary = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    totalCreditsGranted: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    subscriptionTransactions: 0,
    oneTimeTransactions: 0,
  };

  transactions.forEach(transaction => {
    if (transaction.amount) {
      summary.totalAmount += parseFloat(transaction.amount.toString());
    }
    
    if (transaction.creditsGranted) {
      summary.totalCreditsGranted += transaction.creditsGranted;
    }

    switch (transaction.orderStatus) {
      case OrderStatus.SUCCESS:
        summary.successfulTransactions++;
        break;
      case OrderStatus.CREATED:
        summary.pendingTransactions++;
        break;
      case OrderStatus.FAILED:
        summary.failedTransactions++;
        break;
    }

    switch (transaction.type) {
      case TransactionType.SUBSCRIPTION:
        summary.subscriptionTransactions++;
        break;
      case TransactionType.ONE_TIME:
        summary.oneTimeTransactions++;
        break;
    }
  });

  return summary;
}