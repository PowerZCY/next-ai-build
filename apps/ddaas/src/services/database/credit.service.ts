import { Prisma } from '@/db/prisma-model-type';
import type { Credit, CreditUsage } from '@/db/prisma-model-type';
import { CreditType, OperationType } from '@/db/constants';
import { freeAmount, freeExpiredDays } from '@/lib/appConfig';
import { checkAndFallbackWithNonTCClient } from '@/db/prisma';
import { creditUsageService } from '@/db/index';

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

type CreditOperationOptions = {
  context: string;
  operationType: typeof OperationType[keyof typeof OperationType];
  updateMode: 'increment' | 'decrement';
  feature?: string;
  orderId?: string;
  limitAdjustments?: CreditLimitAdjustments;
  defaultLimitAdjustmentsToAmounts?: boolean;
  ensureSufficientBalance?: boolean;
  ensureSufficientLimits?: boolean;
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

  private async executeCreditOperation(
    userId: string,
    amounts: CreditAmounts,
    options: CreditOperationOptions,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const normalized = this.normalizeAmounts(amounts);
    this.ensureNonNegative(normalized, options.context);

    if (!this.hasAnyChange(normalized)) {
      throw new Error(`${options.context}: no credit change specified`);
    }

    let normalizedLimitAdjustments: Required<CreditLimitAdjustments> | undefined;
    if (options.limitAdjustments || options.defaultLimitAdjustmentsToAmounts) {
      const raw = options.limitAdjustments ?? amounts;
      normalizedLimitAdjustments = this.normalizeAmounts(raw);
      this.ensureNonNegative(normalizedLimitAdjustments, `${options.context} limitAdjustments`);
    }

    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });

    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    if (options.ensureSufficientBalance) {
      this.ensureSufficientBalance(currentCredit, normalized);
    }

    if (options.ensureSufficientLimits && normalizedLimitAdjustments) {
      this.ensureSufficientLimits(currentCredit, normalizedLimitAdjustments);
    }

    const data =
      options.updateMode === 'increment'
        ? this.buildIncrementData(normalized, normalizedLimitAdjustments)
        : this.buildDecrementData(normalized, normalizedLimitAdjustments);

    const credit = await client.credit.update({
      where: { userId },
      data,
    });

    const usage = await this.recordCreditUsage(client, userId, options.operationType, normalized, {
      feature: options.feature,
      orderId: options.orderId,
    });

    return { credit, usage };
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

  // Initialize User Credits, use upsert for easy handle anonymous upgrade to register
  async initializeCreditWithFree(
    init: {
      userId: string,
      feature: string,
      creditType: string,
      operationType: string,
      creditsUsed: number,
    }, 
    tx?: Prisma.TransactionClient
  ): Promise<Credit> {
    const now = new Date();
    const freeStart = now;
    const freeEnd = new Date(now);
    freeEnd.setDate(freeEnd.getDate() + freeExpiredDays);
    freeEnd.setHours(23, 59, 59, 999);
    const normalized = this.normalizeAmounts({ free: init.creditsUsed });
    this.ensureNonNegative(normalized, 'initializeCredit');
    const client = checkAndFallbackWithNonTCClient(tx);

    // 这里使用upsert语义是为了代码复用，处理匿名初始化和匿名->注册的初始化
    const credit =  await client.credit.upsert({
      where: {
        userId: init.userId
      },
      update: {
        balanceFree: normalized.free,
        totalFreeLimit: normalized.free,
        freeStart: freeStart,
        freeEnd: freeEnd,
      },
      create: {
        userId: init.userId,
        balanceFree: normalized.free,
        totalFreeLimit: normalized.free,
        freeStart: freeStart,
        freeEnd: freeEnd,
      },
    });

    await creditUsageService.recordCreditOperation( init, tx );

    return credit;
  }

  async payFailedWatcher(
    data: {
      userId: string,
      feature: string,
      orderId: string
      creditType: string,
      operationType: string,
      creditsUsed: number,
    }, 
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    await creditUsageService.recordUsage( data, tx );
    console.warn('payFailedWatcher completed');
  }


  // Get User Credits
  async getCredit(userId: string, tx?: Prisma.TransactionClient): Promise<Credit | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

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
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'rechargeCredit',
        operationType: OperationType.RECHARGE,
        updateMode: 'increment',
        feature: options.feature,
        orderId: options.orderId,
        limitAdjustments: options.limitAdjustments,
        defaultLimitAdjustmentsToAmounts: options.limitAdjustments === undefined,
      },
      tx
    );
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
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'consumeCredit',
        operationType: OperationType.CONSUME,
        updateMode: 'decrement',
        feature: options.feature,
        orderId: options.orderId,
        ensureSufficientBalance: true,
      },
      tx
    );
  }

  // Freeze Credits
  async freezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'freezeCredit',
        operationType: OperationType.FREEZE,
        updateMode: 'decrement',
        feature: reason,
        ensureSufficientBalance: true,
      },
      tx
    );
  }

  // Unfreeze Credits
  async unfreezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'unfreezeCredit',
        operationType: OperationType.UNFREEZE,
        updateMode: 'increment',
        feature: reason,
      },
      tx
    );
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
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'refundCredit',
        operationType: OperationType.CONSUME,
        updateMode: 'decrement',
        feature: options.feature ?? 'Refund',
        orderId,
        limitAdjustments: options.limitAdjustments,
        defaultLimitAdjustmentsToAmounts: options.limitAdjustments === undefined,
        ensureSufficientBalance: true,
        ensureSufficientLimits: true,
      },
      tx
    );
  }

  // Reset Free Credits 
  async resetFreeCredit(userId: string, newLimit: number = freeAmount, tx?: Prisma.TransactionClient): Promise<Credit> {
    const client = checkAndFallbackWithNonTCClient(tx);

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
    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

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

    const increaseDiff = this.normalizeAmounts({
      free: Math.max(nextBalanceFree - currentCredit.balanceFree, 0),
      paid: Math.max(nextBalancePaid - currentCredit.balancePaid, 0),
      oneTimePaid: Math.max(
        nextBalanceOneTimePaid - currentCredit.balanceOneTimePaid,
        0
      ),
    });

    const decreaseDiff = this.normalizeAmounts({
      free: Math.max(currentCredit.balanceFree - nextBalanceFree, 0),
      paid: Math.max(currentCredit.balancePaid - nextBalancePaid, 0),
      oneTimePaid: Math.max(
        currentCredit.balanceOneTimePaid - nextBalanceOneTimePaid,
        0
      ),
    });

    const credit = await client.credit.update({
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

    if (this.hasAnyChange(increaseDiff)) {
      await this.recordCreditUsage(client, userId, OperationType.ADJUST_INCREASE, increaseDiff, {
        feature: 'admin_adjust',
      });
    }

    if (this.hasAnyChange(decreaseDiff)) {
      await this.recordCreditUsage(client, userId, OperationType.ADJUST_DECREASE, decreaseDiff, {
        feature: 'admin_adjust',
      });
    }

    return credit;
  }

  async purgeFreeCredit(
    userId: string,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    const deduction = this.normalizeAmounts({
      free: currentCredit.balanceFree,
      paid: 0,
      oneTimePaid: 0,
    });

    const credit = await client.credit.update({
      where: { userId },
      data: {
        balanceFree: 0,
        totalFreeLimit: 0,
        freeStart: null,
        freeEnd: null,
      },
    });

    const usage = this.hasAnyChange(deduction)
      ? await this.recordCreditUsage(client, userId, OperationType.PURGE, deduction, {
          feature: reason,
        })
      : [];

    return { credit, usage };
  }

  async purgeCredit(
    userId: string,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditUsage[] }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    const deduction = this.normalizeAmounts({
      free: currentCredit.balanceFree,
      paid: currentCredit.balancePaid,
      oneTimePaid: currentCredit.balanceOneTimePaid,
    });

    const credit = await client.credit.update({
      where: { userId },
      data: {
        balanceFree: 0,
        balancePaid: 0,
        balanceOneTimePaid: 0,
        totalFreeLimit: 0,
        totalPaidLimit: 0,
        totalOneTimePaidLimit: 0,
        freeStart: null,
        freeEnd: null,
        paidStart: null,
        paidEnd: null,
        oneTimePaidStart: null,
        oneTimePaidEnd: null,
      },
    });

    const usage = this.hasAnyChange(deduction)
      ? await this.recordCreditUsage(client, userId, OperationType.PURGE, deduction, {
          feature: reason,
        })
      : [];

    return { credit, usage };
  }

  // Get Users with Low Credit Balance
  async getLowBalanceUsers(threshold: number = 10, tx?: Prisma.TransactionClient): Promise<Credit[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const query = Prisma.sql`
      SELECT * FROM credits 
      WHERE (balance_free + balance_paid + balance_onetime_paid) < ${threshold}
      ORDER BY (balance_free + balance_paid + balance_onetime_paid) ASC
    `;

    return await client.$queryRaw<Credit[]>(query);
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
    const client = checkAndFallbackWithNonTCClient(tx);

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
