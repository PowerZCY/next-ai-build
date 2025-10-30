import { CreditType, OperationType, UserStatus } from '@/db/constants';
import { creditService, creditUsageService, subscriptionService, userBackupService, userService } from '@/db/index';
import { prisma } from '@/db/prisma';
import { freeAmount, freeRegisterAmount } from '@/lib/appConfig';
import type { Credit, Prisma, User } from '@prisma/client';


export class UserAggregateService {

  async initAnonymousUser(
    fingerprintId: string,
  ): Promise<{ newUser: User; credit: Credit; }> {
    return prisma.$transaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          fingerprintId,
          status: UserStatus.ANONYMOUS,
        },
        tx
      );

      const credit = await creditService.initializeCreditWithFree( newUser.userId, freeAmount, tx );

      await creditUsageService.recordCreditOperation(
        {
          userId: newUser.userId,
          feature: 'anonymous_user_init',
          creditType: CreditType.FREE,
          operationType: OperationType.RECHARGE,
          creditsUsed: freeAmount,
        },
        tx
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);

      return { newUser, credit };
    });
  }

  /**
   * 创建新的注册用户
   *
   * 初始化步骤（与 credit 平行）：
   * 1. 创建 User 记录
   * 2. 初始化 Credit 记录（免费积分）
   * 3. 初始化 Subscription 记录（占位符，status=INCOMPLETE）
   * 4. 记录 CreditUsage（审计）
   *
   * 后续当用户通过 Stripe 订阅时：
   * - session.completed 或 invoice.paid 会 UPDATE subscription 记录
   * - 不需要 CREATE，只需 UPDATE 确保逻辑一致
   */
  async createNewRegisteredUser(
    clerkUserId: string,
    email?: string,
    fingerprintId?: string
  ): Promise<{ newUser: User; credit: Credit; }> {

    const { newUser, credit } = await prisma.$transaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          clerkUserId,
          email,
          fingerprintId,
          status: UserStatus.REGISTERED,
        },
        tx
      );

      const credit = await creditService.initializeCreditWithFree( newUser.userId, freeRegisterAmount, tx );

      await creditUsageService.recordCreditOperation(
        {
          userId: newUser.userId,
          feature: 'user_registration_init',
          creditType: CreditType.FREE,
          operationType: OperationType.RECHARGE,
          creditsUsed: freeRegisterAmount,
        },
        tx
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);

      return { newUser: newUser, credit: credit };
    });

    return { newUser, credit }; 
  }

  async hardDeleteUserByClerkId(clerkUserId: string): Promise<string | null> { 
    const deletedUserId =  await prisma.$transaction(async (tx) => { 
      // 根据clerkUserId查找用户
      const user = await userService.findByClerkUserId(clerkUserId, tx);
      if (!user) {
        console.log(`User with clerkUserId ${clerkUserId} not found`);
        return null;
      }
      await this.hardDeleteUser(user.userId);
      return user.userId;
    });
    return deletedUserId;
  }

  async hardDeleteUser(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const txClient =  tx ?? prisma
    const user = await this.findUserWithRelations(userId, txClient);
    if (!user) {
      return;
    }
    await userBackupService.createBackup(
      {
        originalUserId: user.userId,
        fingerprintId: user.fingerprintId || undefined,
        clerkUserId: user.clerkUserId || undefined,
        email: user.email || undefined,
        status: user.status,
        backupData: user,
      },
      txClient
    );

    await txClient.user.delete({
      where: { userId },
    });

    // await creditService.freezeCredit();
  }

  private async findUserWithRelations(
    userId: string,
    tx: Prisma.TransactionClient
  ) {
    return tx.user.findUnique({
      where: { userId },
      include: {
        credits: true,
        subscriptions: true,
        transactions: true,
        creditUsage: true,
      },
    });
  }
}

export const userAggregateService = new UserAggregateService();
