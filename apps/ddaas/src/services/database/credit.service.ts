import type { Prisma } from '@prisma/client';
import type { Credit, CreditUsage } from '@prisma/client';
import { CreditType, OperationType } from '@/db/constants';
import { freeAmount, freeExpiredDays } from '@/lib/appConfig';
import { getDbClient } from '@/db/prisma';

type CreditAmounts = {
  free?: number;
  paid?: number;
  oneTimePaid?: number;
};

type CreditLimitAdjustments = {
  free?: number;
  paid?: number;
  oneTimePaid?: number;
};

export class CreditService {

  private normalizeAmounts(amounts?: CreditAmounts): Required<CreditAmounts> {
    return {
      free: Math.trunc(amounts?.free ?? 0),
      paid: Math.trunc(amounts?.paid ?? 0),
      oneTimePaid: Math.trunc(amounts?.oneTimePaid ?? 0),
    };
  }

  private hasAnyChange(amounts: Required<CreditAmounts>): boolean {
    return amounts.free !== 0 || amounts.paid !== 0 || amounts.oneTimePaid !== 0;
  }

  private ensureNonNegative(amounts: Required<CreditAmounts>, context: string) {
    if (amounts.free < 0 || amounts.paid < 0 || amounts.oneTimePaid < 0) {
      throw new Error(`${context}: negative credit adjustments are not allowed`);
    }
  }

  private ensureSufficientBalance(current: Credit, deduction: Required<CreditAmounts>) {
    if (deduction.free > current.balanceFree) {
      throw new Error('Insufficient free credits');
    }
    if (deduction.paid > current.balancePaid) {
      throw new Error('Insufficient paid credits');
    }
    if (deduction.oneTimePaid > current.balanceOneTimePaid) {
      throw new Error('Insufficient one-time paid credits');
    }
  }

  private ensureSufficientLimits(current: Credit, deduction: Required<CreditLimitAdjustments>) {
    if (deduction.free > current.totalFreeLimit) {
      throw new Error('Insufficient free credit limit');
    }
    if (deduction.paid > current.totalPaidLimit) {
      throw new Error('Insufficient paid credit limit');
    }
    if (deduction.oneTimePaid > current.totalOneTimePaidLimit) {
      throw new Error('Insufficient one-time paid credit limit');
    }
  }

  private buildIncrementData(
    amounts: Required<CreditAmounts>,
    limitAdjustments?: Required<CreditLimitAdjustments>
  ): Prisma.CreditUpdateInput {
    const data: Prisma.CreditUpdateInput = {};
    if (amounts.free !== 0) {
      data.balanceFree = { increment: amounts.free };
      if (limitAdjustments && limitAdjustments.free !== 0) {
        data.totalFreeLimit = { increment: limitAdjustments.free };
      }
    }
    if (amounts.paid !== 0) {
      data.balancePaid = { increment: amounts.paid };
      if (limitAdjustments && limitAdjustments.paid !== 0) {
        data.totalPaidLimit = { increment: limitAdjustments.paid };
      }
    }
    if (amounts.oneTimePaid !== 0) {
      data.balanceOneTimePaid = { increment: amounts.oneTimePaid };
      if (limitAdjustments && limitAdjustments.oneTimePaid !== 0) {
        data.totalOneTimePaidLimit = { increment: limitAdjustments.oneTimePaid };
      }
    }
    return data;
  }

  private buildDecrementData(
    amounts: Required<CreditAmounts>,
    limitAdjustments?: Required<CreditLimitAdjustments>
  ): Prisma.CreditUpdateInput {
    const data: Prisma.CreditUpdateInput = {};
    if (amounts.free !== 0) {
      data.balanceFree = { decrement: amounts.free };
      if (limitAdjustments && limitAdjustments.free !== 0) {
        data.totalFreeLimit = { decrement: limitAdjustments.free };
      }
    }
    if (amounts.paid !== 0) {
      data.balancePaid = { decrement: amounts.paid };
      if (limitAdjustments && limitAdjustments.paid !== 0) {
        data.totalPaidLimit = { decrement: limitAdjustments.paid };
      }
    }
    if (amounts.oneTimePaid !== 0) {
      data.balanceOneTimePaid = { decrement: amounts.oneTimePaid };
      if (limitAdjustments && limitAdjustments.oneTimePaid !== 0) {
        data.totalOneTimePaidLimit = { decrement: limitAdjustments.oneTimePaid };
      }
    }
    return data;
  }

  private async recordCreditUsage(
    client: Prisma.TransactionClient,
    userId: string,
    operationType: string,
    amounts: Required<CreditAmounts>,
    options: {
      feature?: string;
      orderId?: string;
    } = {}
  ): Promise<CreditUsage[]> {
    const usagePayload: Prisma.CreditUsageUncheckedCreateInput[] = [];

    if (amounts.free > 0) {
      usagePayload.push({
        userId,
        feature: options.feature,
        orderId: options.orderId,
        creditType: CreditType.FREE,
        operationType,
        creditsUsed: amounts.free,
      });
    }

    if (amounts.paid > 0) {
      usagePayload.push({
        userId,
        feature: options.feature,
        orderId: options.orderId,
        creditType: CreditType.PAID,
        operationType,
        creditsUsed: amounts.paid,
      });
    }

    if (amounts.oneTimePaid > 0) {
      usagePayload.push({
        userId,
        feature: options.feature,
        orderId: options.orderId,
        creditType: CreditType.PAID,
        operationType,
        creditsUsed: amounts.oneTimePaid,
      });
    }

    if (usagePayload.length === 0) {
      return [];
    }

    const usages: CreditUsage[] = [];
    for (const payload of usagePayload) {
      const usage = await client.creditUsage.create({ data: payload });
      usages.push(usage);
    }

    return usages;
  }

  // Initialize User Credits
  async initializeCreditWithFree(
    userId: string,
    free: number,
    tx?: Prisma.TransactionClient
  ): Promise<Credit> {
    const now = new Date();
    const freeStart = now;
    const freeEnd = new Date(now);
    freeEnd.setDate(freeEnd.getDate() + freeExpiredDays);
    freeEnd.setHours(23, 59, 59, 999);
    const normalized = this.normalizeAmounts({ free });
    this.ensureNonNegative(normalized, 'initializeCredit');
    const client = getDbClient(tx);

    return await client.credit.create({
      data: {
        userId,
        balanceFree: normalized.free,
        totalFreeLimit: normalized.free,
        freeStart: freeStart,
        freeEnd: freeEnd,
      },
    });
  }

  // Get User Credits
  async getCredit(userId: string, tx?: Prisma.TransactionClient): Promise<Credit | null> {
    const client = getDbClient(tx);

    const credit = await client.credit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return null;
    }

    // Guard query result: if a credit block has no end time or is already expired, treat its balance as 0
    const now = new Date();
    const protectedCredit: Credit = { ...credit };

    if (!credit.freeEnd || now >= credit.freeEnd) {
      protectedCredit.balanceFree = 0;
    }

    if (!credit.paidEnd || now >= credit.paidEnd) {
      protectedCredit.balancePaid = 0;
    }

    if (!credit.oneTimePaidEnd || now >= credit.oneTimePaidEnd) {
      protectedCredit.balanceOneTimePaid = 0;
    }

    return protectedCredit;
  }

  // Get Total Credit Balance
  async getTotalBalance(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const credits = await this.getCredit(userId, tx);
    if (!credits) return 0;
    return credits.balanceFree + credits.balancePaid + credits.balanceOneTimePaid;
  }

  // Recharge Credits (Transactional)
  async rechargeCredit(
    userId: string,
    amounts: CreditAmounts,
    options: {
      orderId?: string;
      feature?: string;
      limitAdjustments?: CreditLimitAdjustments;
    } = {},
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = getDbClient(tx);
    const normalized = this.normalizeAmounts(amounts);
      this.ensureNonNegative(normalized, 'rechargeCredit');

      if (!this.hasAnyChange(normalized)) {
        throw new Error('rechargeCredit: no credit change specified');
      }

      const limitAdjustments = options.limitAdjustments
        ? this.normalizeAmounts(options.limitAdjustments)
        : normalized;
      this.ensureNonNegative(limitAdjustments, 'rechargeCredit limitAdjustments');

      const currentCredit = await client.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      const credit = await client.credit.update({
        where: { userId },
        data: this.buildIncrementData(normalized, limitAdjustments),
      });

      const usage = await this.recordCreditUsage(client, userId, OperationType.RECHARGE, normalized, {
        feature: options.feature,
        orderId: options.orderId,
      });

      return { credit, usage };
  }

  // Consume Credits (Transactional)
  async consumeCredit(
    userId: string,
    amounts: CreditAmounts,
    options: {
      feature: string;
      orderId?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    
    const client = getDbClient(tx);
    const normalized = this.normalizeAmounts(amounts);
      this.ensureNonNegative(normalized, 'consumeCredit');

      if (!this.hasAnyChange(normalized)) {
        throw new Error('consumeCredit: no credit change specified');
      }

      const currentCredit = await client.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      this.ensureSufficientBalance(currentCredit, normalized);

      const credit = await client.credit.update({
        where: { userId },
        data: this.buildDecrementData(normalized),
      });

      const usage = await this.recordCreditUsage(client, userId, OperationType.CONSUME, normalized, {
        feature: options.feature,
        orderId: options.orderId,
      });

      return { credit, usage };
  }

  // Freeze Credits
  async freezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = getDbClient(tx);
    const normalized = this.normalizeAmounts(amounts);
      this.ensureNonNegative(normalized, 'freezeCredit');

      if (!this.hasAnyChange(normalized)) {
        throw new Error('freezeCredit: no credit change specified');
      }

      const currentCredit = await client.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      this.ensureSufficientBalance(currentCredit, normalized);

      const credit = await client.credit.update({
        where: { userId },
        data: this.buildDecrementData(normalized),
      });

      const usage = await this.recordCreditUsage(client, userId, OperationType.FREEZE, normalized, {
        feature: reason,
      });

      return { credit, usage };
  }

  // Unfreeze Credits
  async unfreezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = getDbClient(tx);
    const normalized = this.normalizeAmounts(amounts);
      this.ensureNonNegative(normalized, 'unfreezeCredit');

      if (!this.hasAnyChange(normalized)) {
        throw new Error('unfreezeCredit: no credit change specified');
      }

      const currentCredit = await client.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      const credit = await client.credit.update({
        where: { userId },
        data: this.buildIncrementData(normalized),
      });

      const usage = await this.recordCreditUsage(client, userId, OperationType.UNFREEZE, normalized, {
        feature: reason,
      });

      return { credit, usage };
      
  }

  // Refund Credits
  async refundCredit(
    userId: string,
    amounts: CreditAmounts,
    orderId: string,
    options: {
      feature?: string;
      limitAdjustments?: CreditLimitAdjustments;
    } = {},
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = getDbClient(tx);
    const normalized = this.normalizeAmounts(amounts);
      this.ensureNonNegative(normalized, 'refundCredit');

      if (!this.hasAnyChange(normalized)) {
        throw new Error('refundCredit: no credit change specified');
      }

      const limitAdjustments = options.limitAdjustments
        ? this.normalizeAmounts(options.limitAdjustments)
        : normalized;
      this.ensureNonNegative(limitAdjustments, 'refundCredit limitAdjustments');

      const currentCredit = await client.credit.findUnique({
        where: { userId },
      });

      if (!currentCredit) {
        throw new Error('User credits not found');
      }

      this.ensureSufficientBalance(currentCredit, normalized);
      this.ensureSufficientLimits(currentCredit, limitAdjustments);

      const credit = await client.credit.update({
        where: { userId },
        data: this.buildDecrementData(normalized, limitAdjustments),
      });

      const usage = await this.recordCreditUsage(client, userId, OperationType.CONSUME, normalized, {
        feature: options.feature ?? 'Refund',
        orderId,
      });

      return { credit, usage };
  }

  // Reset Free Credits 
  async resetFreeCredit(userId: string, newLimit: number = freeAmount, tx?: Prisma.TransactionClient): Promise<Credit> {
    const client = getDbClient(tx);

    return await client.credit.update({
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
      balanceOneTimePaid?: number;
      totalFreeLimit?: number;
      totalPaidLimit?: number;
      totalOneTimePaidLimit?: number;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Credit> {
    const currentCredit = await this.getCredit(userId, tx);
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    const client = getDbClient(tx);

    const nextBalanceFree = adjustments.balanceFree ?? currentCredit.balanceFree;
    const nextBalancePaid = adjustments.balancePaid ?? currentCredit.balancePaid;
    const nextBalanceOneTimePaid =
      adjustments.balanceOneTimePaid ?? currentCredit.balanceOneTimePaid;
    const nextTotalFreeLimit = adjustments.totalFreeLimit ?? currentCredit.totalFreeLimit;
    const nextTotalPaidLimit = adjustments.totalPaidLimit ?? currentCredit.totalPaidLimit;
    const nextTotalOneTimePaidLimit =
      adjustments.totalOneTimePaidLimit ?? currentCredit.totalOneTimePaidLimit;

    if (
      nextBalanceFree < 0 ||
      nextBalancePaid < 0 ||
      nextBalanceOneTimePaid < 0 ||
      nextTotalFreeLimit < 0 ||
      nextTotalPaidLimit < 0 ||
      nextTotalOneTimePaidLimit < 0
    ) {
      throw new Error('adjustCredit: credit values cannot be negative');
    }

    return await client.credit.update({
      where: { userId },
      data: {
        balanceFree: nextBalanceFree,
        balancePaid: nextBalancePaid,
        balanceOneTimePaid: nextBalanceOneTimePaid,
        totalFreeLimit: nextTotalFreeLimit,
        totalPaidLimit: nextTotalPaidLimit,
        totalOneTimePaidLimit: nextTotalOneTimePaidLimit,
      },
    });
  }

  // Get Users with Low Credit Balance
  async getLowBalanceUsers(threshold: number = 10, tx?: Prisma.TransactionClient): Promise<Credit[]> {
    const client = getDbClient(tx);

    return await client.$queryRaw<Credit[]>`
      SELECT * FROM credits 
      WHERE (balance_free + balance_paid + balance_onetime_paid) < ${threshold}
      ORDER BY (balance_free + balance_paid + balance_onetime_paid) ASC
    `;
  }

  // Get Credit Statistics
  async getCreditStats(tx?: Prisma.TransactionClient): Promise<{
    totalUsers: number;
    totalFreeBalance: number;
    totalPaidBalance: number;
    totalOneTimePaidBalance: number;
    avgFreeBalance: number;
    avgPaidBalance: number;
    avgOneTimePaidBalance: number;
    zeroBalanceUsers: number;
  }> {
    const client = getDbClient(tx);

    const stats = await client.credit.aggregate({
      _count: true,
      _sum: {
        balanceFree: true,
        balancePaid: true,
        balanceOneTimePaid: true,
      },
      _avg: {
        balanceFree: true,
        balancePaid: true,
        balanceOneTimePaid: true,
      },
    });

    const zeroBalanceUsers = await client.credit.count({
      where: {
        AND: [
          { balanceFree: 0 },
          { balancePaid: 0 },
          { balanceOneTimePaid: 0 },
        ],
      },
    });

    return {
      totalUsers: stats._count,
      totalFreeBalance: stats._sum.balanceFree || 0,
      totalPaidBalance: stats._sum.balancePaid || 0,
      totalOneTimePaidBalance: stats._sum.balanceOneTimePaid || 0,
      avgFreeBalance: Math.round(stats._avg.balanceFree || 0),
      avgPaidBalance: Math.round(stats._avg.balancePaid || 0),
      avgOneTimePaidBalance: Math.round(stats._avg.balanceOneTimePaid || 0),
      zeroBalanceUsers,
    };
  }

  // Check if User has Enough Credits
  async hasEnoughCredits(userId: string, amount: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const totalBalance = await this.getTotalBalance(userId, tx);
    return totalBalance >= amount;
  }
}

export const creditService = new CreditService();
