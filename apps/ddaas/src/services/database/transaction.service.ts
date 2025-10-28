/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient, Prisma } from '@prisma/client';
import type { Transaction } from '@prisma/client';
import { OrderStatus, TransactionType, PaySupplier } from '@/db/constants';

const prisma = new PrismaClient();

export class TransactionService {
  // Create transaction order
  async createTransaction(data: {
    userId: string;
    orderId: string;
    orderStatus?: string;
    paySupplier?: PaySupplier;
    payTransactionId?: string;
    paySubscriptionId?: string;
    paySessionId?: string;
    payInvoiceId?: string;
    billingReason?: string;
    priceId?: string;
    priceName?: string;
    amount?: number;
    currency?: string;
    type?: string;
    creditsGranted?: number;
    orderDetail?: string;
    orderExpiredAt?: Date;
    paidAt?: Date;
    payUpdatedAt?: Date;
  }): Promise<Transaction> {
    return await prisma.transaction.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        orderStatus: data.orderStatus || OrderStatus.CREATED,
        orderExpiredAt: data.orderExpiredAt || new Date(Date.now() + 30 * 60 * 1000), // 默认30分钟过期
        paySupplier: data.paySupplier,
        payTransactionId: data.payTransactionId,
        paySubscriptionId: data.paySubscriptionId,
        paySessionId: data.paySessionId,
        payInvoiceId: data.payInvoiceId,
        billingReason: data.billingReason,
        priceId: data.priceId,
        priceName: data.priceName,
        amount: data.amount,
        currency: data.currency || 'CNY',
        type: data.type,
        creditsGranted: data.creditsGranted || 0,
        orderDetail: data.orderDetail,
        paidAt: data.paidAt,
        payUpdatedAt: data.payUpdatedAt,
      },
    });
  }

  // Find transaction by order ID
  async findByOrderId(orderId: string): Promise<Transaction | null> {
    return await prisma.transaction.findFirst({
      where: { orderId, deleted: 0 },
      include: {
        user: true,
      },
    });
  }

  // Find transaction by pay session ID
  async findByPaySessionId(
    paySessionId: string
  ): Promise<Transaction | null> {
    return await prisma.transaction.findFirst({
      where: { paySessionId, deleted: 0 },
      include: {
        user: true,
      },
    });
  }

  // Find transaction by pay transaction ID
  async findByPayTransactionId(
    payTransactionId: string
  ): Promise<Transaction | null> {
    return await prisma.transaction.findFirst({
      where: { payTransactionId, deleted: 0 },
    });
  }

  // Find transactions by user ID
  async findByUserId(
    userId: string,
    params?: {
      orderStatus?: string;
      type?: string;
      skip?: number;
      take?: number;
      orderBy?: Prisma.TransactionOrderByWithRelationInput;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = { userId, deleted: 0 };

    if (params?.orderStatus) {
      where.orderStatus = params.orderStatus;
    }

    if (params?.type) {
      where.type = params.type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 10,
        orderBy: params?.orderBy || { orderCreatedAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  // Update transaction status
  async updateStatus(
    orderId: string,
    orderStatus: string,
    additionalData?: {
      payTransactionId?: string;
      paidAt?: Date;
      paidEmail?: string;
      paidDetail?: string;
      payUpdatedAt?: Date;
    }
  ): Promise<Transaction> {
    const updateData: Prisma.TransactionUpdateInput = {
      orderStatus,
      ...additionalData,
    };

    console.log(`orderId: ${orderId}\n updateData: ${JSON.stringify(updateData)}`)
    return await prisma.transaction.update({
      where: { orderId },
      data: updateData,
    });
  }

  // Complete payment
  async completePayment(
    orderId: string,
    paymentData: {
      payTransactionId?: string;
      paidAt: Date;
      paidEmail?: string;
      paidDetail?: string;
      creditsGranted?: number;
      payUpdatedAt?: Date;
    }
  ): Promise<Transaction> {
    return await prisma.transaction.update({
      where: { orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
        payTransactionId: paymentData.payTransactionId,
        paidAt: paymentData.paidAt,
        paidEmail: paymentData.paidEmail,
        paidDetail: paymentData.paidDetail,
        creditsGranted: paymentData.creditsGranted,
        payUpdatedAt: paymentData.payUpdatedAt,
      },
    });
  }

  // Process refund
  async processRefund(
    orderId: string,
    refundData: {
      refundAmount?: number;
      refundReason?: string;
      refundedAt?: Date;
    }
  ): Promise<Transaction> {
    const transaction = await this.findByOrderId(orderId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return await prisma.transaction.update({
      where: { orderId },
      data: {
        orderStatus: OrderStatus.REFUNDED,
        orderDetail: JSON.stringify({
          original: transaction.orderDetail,
          refund: {
            amount: refundData.refundAmount,
            reason: refundData.refundReason,
            refundedAt: refundData.refundedAt || new Date(),
          },
        }),
      },
    });
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<Transaction> {
    return await prisma.transaction.update({
      where: { orderId },
      data: {
        orderStatus: OrderStatus.CANCELED,
        orderDetail: reason || 'User canceled',
      },
    });
  }

  // Get expired orders
  async getExpiredOrders(): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        orderStatus: OrderStatus.CREATED,
        deleted: 0,
        orderExpiredAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Update expired orders status
  async updateExpiredOrders(): Promise<number> {
    const result = await prisma.transaction.updateMany({
      where: {
        orderStatus: OrderStatus.CREATED,
        deleted: 0,
        orderExpiredAt: {
          lt: new Date(),
        },
      },
      data: {
        orderStatus: OrderStatus.FAILED,
        orderDetail: 'Order expired',
      },
    });

    return result.count;
  }

  // Get subscription related transactions
  async getSubscriptionTransactions(
    paySubscriptionId: string
  ): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: { paySubscriptionId, deleted: 0 },
      orderBy: { orderCreatedAt: 'desc' },
    });
  }

  // Get revenue statistics
  async getRevenueStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    subscriptionRevenue: number;
    oneTimeRevenue: number;
    refundedAmount: number;
  }> {
    const where: Prisma.TransactionWhereInput = {
      orderStatus: OrderStatus.SUCCESS,
      deleted: 0,
    };

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt.gte = startDate;
      if (endDate) where.paidAt.lte = endDate;
    }

    // Get successful transactions
    const successfulTransactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
      },
    });

    // Get refund transactions
    const refundWhere: Prisma.TransactionWhereInput = {
      orderStatus: OrderStatus.REFUNDED,
      deleted: 0,
    };

    if (startDate || endDate) {
      refundWhere.orderUpdatedAt = {};
      if (startDate) refundWhere.orderUpdatedAt.gte = startDate;
      if (endDate) refundWhere.orderUpdatedAt.lte = endDate;
    }

    const refundedTransactions = await prisma.transaction.findMany({
      where: refundWhere,
      select: { amount: true },
    });

    // Calculate statistics
    const totalRevenue = successfulTransactions.reduce(
      (sum, t) => sum + (t.amount ? parseFloat(t.amount.toString()) : 0),
      0
    );

    const subscriptionRevenue = successfulTransactions
      .filter(t => t.type === TransactionType.SUBSCRIPTION)
      .reduce((sum, t) => sum + (t.amount ? parseFloat(t.amount.toString()) : 0), 0);

    const oneTimeRevenue = successfulTransactions
      .filter(t => t.type === TransactionType.ONE_TIME)
      .reduce((sum, t) => sum + (t.amount ? parseFloat(t.amount.toString()) : 0), 0);

    const refundedAmount = refundedTransactions.reduce(
      (sum, t) => sum + (t.amount ? parseFloat(t.amount.toString()) : 0),
      0
    );

    return {
      totalRevenue,
      totalTransactions: successfulTransactions.length,
      averageOrderValue: successfulTransactions.length > 0
        ? totalRevenue / successfulTransactions.length
        : 0,
      subscriptionRevenue,
      oneTimeRevenue,
      refundedAmount,
    };
  }

  // Get daily revenue
  async getDailyRevenue(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await prisma.$queryRaw`
      SELECT 
        DATE(paid_at) as date,
        COUNT(*) as transactions,
        SUM(amount) as revenue,
        SUM(CASE WHEN type = 'subscription' THEN amount ELSE 0 END) as subscription_revenue,
        SUM(CASE WHEN type = 'one_time' THEN amount ELSE 0 END) as onetime_revenue
      FROM transactions
      WHERE order_status = 'success'
        AND deleted = 0
        AND paid_at >= ${startDate}
      GROUP BY DATE(paid_at)
      ORDER BY date DESC
    `;

    return result as any[];
  }

  // Soft Delete transaction
  async deleteTransaction(orderId: string): Promise<void> {
    await prisma.transaction.update({
      where: { orderId },
      data: { deleted: 1 },
    });
  }

  // Create batch transactions
  async createBatchTransactions(
    transactions: Prisma.TransactionCreateManyInput[]
  ): Promise<number> {
    const result = await prisma.transaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });

    return result.count;
  }
}

export const transactionService = new TransactionService();