import { PrismaClient, Prisma } from '@prisma/client';
import type { Credit, CreditUsage } from '@prisma/client';
import { CreditType, OperationType } from '@/db/constants';
import { freeExpiredDays } from '@/lib/appConfig';

const prisma = new PrismaClient();

export class CreditService {
  // Initialize User Credits
  async initializeCredit(
    userId: string,
    freeCredits: number = 50,
    paidCredits: number = 0
  ): Promise<Credit> {
    const now = new Date();
    const freeStart = now;
    const freeEnd = new Date(now);
    freeEnd.setDate(freeEnd.getDate() + freeExpiredDays);
    freeEnd.setHours(23, 59, 59, 999);
    return await prisma.credit.create({
      data: {
        userId,
        balanceFree: freeCredits,
        totalFreeLimit: freeCredits,
        freeStart: freeStart,
        freeEnd: freeEnd,
        balancePaid: paidCredits,
        totalPaidLimit: paidCredits,
      },
    });
  }

  // Get User Credits
  async getCredit(userId: string): Promise<Credit | null> {
    return await prisma.credit.findUnique({
      where: { userId },
    });
  }

  // Get Total Credit Balance
  async getTotalBalance(userId: string): Promise<number> {
    const credits = await this.getCredit(userId);
    if (!credits) return 0;
    return credits.balanceFree + credits.balancePaid;
  }

  // Recharge Credits (Transactional)
  async rechargeCredit(
    userId: string,
    amount: number,
    creditType: string,
    orderId?: string,
    feature?: string
  ): Promise<{ credit: Credit; usage: CreditUsage }> {
    return await prisma.$transaction(async (tx) => {
      // Get Current Credits
      const currentCredit = await tx.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      // Update Credits
      const updateData: Prisma.CreditUpdateInput = {};
      if (creditType === CreditType.FREE) {
        updateData.balanceFree = currentCredit.balanceFree + amount;
        updateData.totalFreeLimit = currentCredit.totalFreeLimit + amount;
      } else {
        updateData.balancePaid = currentCredit.balancePaid + amount;
        updateData.totalPaidLimit = currentCredit.totalPaidLimit + amount;
      }

      const credit = await tx.credit.update({
        where: { userId },
        data: updateData,
      });

      // Record Credit Recharge
      const usage = await tx.creditUsage.create({
        data: {
          userId,
          feature,
          orderId,
          creditType,
          operationType: OperationType.RECHARGE,
          creditsUsed: amount,
        },
      });

      return { credit, usage };
    });
  }

  // Consume Credits (Transactional)
  async consumeCredit(
    userId: string,
    amount: number,
    feature: string,
    orderId?: string
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    return await prisma.$transaction(async (tx) => {
      // Get Current Credits
      const currentCredit = await tx.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      // Check Total Balance
      const totalBalance = currentCredit.balanceFree + currentCredit.balancePaid;
      if (totalBalance < amount) {
        throw new Error('Insufficient credits');
      }

      // Prioritize Free Credits
      const freeToDeduct = Math.min(amount, currentCredit.balanceFree);
      const paidToDeduct = amount - freeToDeduct;

      const credit = await tx.credit.update({
        where: { userId },
        data: {
          balanceFree: currentCredit.balanceFree - freeToDeduct,
          balancePaid: currentCredit.balancePaid - paidToDeduct,
        },
      });

      // Record Credit Consume
      const usageRecords = [];
      if (freeToDeduct > 0) {
        const freeUsage = await tx.creditUsage.create({
          data: {
            userId,
            feature,
            orderId,
            creditType: CreditType.FREE,
            operationType: OperationType.CONSUME,
            creditsUsed: freeToDeduct,
          },
        });
        usageRecords.push(freeUsage);
      }

      if (paidToDeduct > 0) {
        const paidUsage = await tx.creditUsage.create({
          data: {
            userId,
            feature,
            orderId,
            creditType: CreditType.PAID,
            operationType: OperationType.CONSUME,
            creditsUsed: paidToDeduct,
          },
        });
        usageRecords.push(paidUsage);
      }

      return { credit, usage: usageRecords };
    });
  }

  // Freeze Credits
  async freezeCredit(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ credit: Credit; usage: CreditUsage }> {
    return await prisma.$transaction(async (tx) => {
      const currentCredit = await tx.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      // Prioritize Freezing Paid Credits
      const paidToFreeze = Math.min(amount, currentCredit.balancePaid);
      const freeToFreeze = amount - paidToFreeze;

      if (freeToFreeze > currentCredit.balanceFree) {
        throw new Error('Insufficient credits to freeze');
      }

      const credit = await tx.credit.update({
        where: { userId },
        data: {
          balanceFree: currentCredit.balanceFree - freeToFreeze,
          balancePaid: currentCredit.balancePaid - paidToFreeze,
        },
      });

      const usage = await tx.creditUsage.create({
        data: {
          userId,
          feature: reason,
          creditType: paidToFreeze > 0 ? CreditType.PAID : CreditType.FREE,
          operationType: OperationType.FREEZE,
          creditsUsed: amount,
        },
      });

      return { credit, usage };
    });
  }

  // Unfreeze Credits
  async unfreezeCredit(
    userId: string,
    amount: number,
    creditType: string,
    reason: string
  ): Promise<{ credit: Credit; usage: CreditUsage }> {
    return await prisma.$transaction(async (tx) => {
      const currentCredit = await tx.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      const updateData: Prisma.CreditUpdateInput = {};
      if (creditType === CreditType.FREE) {
        updateData.balanceFree = currentCredit.balanceFree + amount;
      } else {
        updateData.balancePaid = currentCredit.balancePaid + amount;
      }

      const credit = await tx.credit.update({
        where: { userId },
        data: updateData,
      });

      const usage = await tx.creditUsage.create({
        data: {
          userId,
          feature: reason,
          creditType,
          operationType: OperationType.UNFREEZE,
          creditsUsed: amount,
        },
      });

      return { credit, usage };
    });
  }

  // Refund Credits
  async refundCredit(
    userId: string,
    amount: number,
    orderId: string
  ): Promise<{ credit: Credit; usage: CreditUsage }> {
    return await prisma.$transaction(async (tx) => {
      const currentCredit = await tx.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      // Refund Prioritize Deduction of Paid Credits
      const paidToDeduct = Math.min(amount, currentCredit.balancePaid);
      const freeToDeduct = amount - paidToDeduct;

      const credit = await tx.credit.update({
        where: { userId },
        data: {
          balancePaid: Math.max(0, currentCredit.balancePaid - paidToDeduct),
          balanceFree: Math.max(0, currentCredit.balanceFree - freeToDeduct),
          totalPaidLimit: Math.max(0, currentCredit.totalPaidLimit - paidToDeduct),
          totalFreeLimit: Math.max(0, currentCredit.totalFreeLimit - freeToDeduct),
        },
      });

      const usage = await tx.creditUsage.create({
        data: {
          userId,
          feature: 'Refund',
          orderId,
          creditType: paidToDeduct > 0 ? CreditType.PAID : CreditType.FREE,
          operationType: OperationType.CONSUME,
          creditsUsed: amount,
        },
      });

      return { credit, usage };
    });
  }

  // Reset Free Credits 
  async resetFreeCredit(userId: string, newLimit: number = 50): Promise<Credit> {
    return await prisma.credit.update({
      where: { userId },
      data: {
        balanceFree: newLimit,
        totalFreeLimit: newLimit,
      },
    });
  }

  // Batch Update Credits (Admin Operation)
  async adjustCredit(
    userId: string,
    adjustments: {
      balanceFree?: number;
      balancePaid?: number;
      totalFreeLimit?: number;
      totalPaidLimit?: number;
    }
  ): Promise<Credit> {
    const currentCredit = await this.getCredit(userId);
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    return await prisma.credit.update({
      where: { userId },
      data: {
        balanceFree: adjustments.balanceFree ?? currentCredit.balanceFree,
        balancePaid: adjustments.balancePaid ?? currentCredit.balancePaid,
        totalFreeLimit: adjustments.totalFreeLimit ?? currentCredit.totalFreeLimit,
        totalPaidLimit: adjustments.totalPaidLimit ?? currentCredit.totalPaidLimit,
      },
    });
  }

  // Get Users with Low Credit Balance
  async getLowBalanceUsers(threshold: number = 10): Promise<Credit[]> {
    return await prisma.$queryRaw<Credit[]>`
      SELECT * FROM credits 
      WHERE (balance_free + balance_paid) < ${threshold}
      ORDER BY (balance_free + balance_paid) ASC
    `;
  }

  // Get Credit Statistics
  async getCreditStats(): Promise<{
    totalUsers: number;
    totalFreeBalance: number;
    totalPaidBalance: number;
    avgFreeBalance: number;
    avgPaidBalance: number;
    zeroBalanceUsers: number;
  }> {
    const stats = await prisma.credit.aggregate({
      _count: true,
      _sum: {
        balanceFree: true,
        balancePaid: true,
      },
      _avg: {
        balanceFree: true,
        balancePaid: true,
      },
    });

    const zeroBalanceUsers = await prisma.credit.count({
      where: {
        AND: [
          { balanceFree: 0 },
          { balancePaid: 0 },
        ],
      },
    });

    return {
      totalUsers: stats._count,
      totalFreeBalance: stats._sum.balanceFree || 0,
      totalPaidBalance: stats._sum.balancePaid || 0,
      avgFreeBalance: Math.round(stats._avg.balanceFree || 0),
      avgPaidBalance: Math.round(stats._avg.balancePaid || 0),
      zeroBalanceUsers,
    };
  }

  // Check if User has Enough Credits
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const totalBalance = await this.getTotalBalance(userId);
    return totalBalance >= amount;
  }
}

export const creditService = new CreditService();