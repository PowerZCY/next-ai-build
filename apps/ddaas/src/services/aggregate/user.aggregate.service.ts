import { CreditType, OperationType, UserStatus } from '@/db/constants';
import { creditService, subscriptionService, userService } from '@/db/index';
import { checkAndFallbackWithNonTCClient } from '@/db/prisma';
import type { Credit, Prisma, User } from '@/db/prisma-model-type';
import { freeAmount, freeRegisterAmount } from '@/lib/appConfig';
import { runInTransaction } from '../database/prisma-transaction-util';


export class UserAggregateService {

  async initAnonymousUser(
    fingerprintId: string,
  ): Promise<{ newUser: User; credit: Credit; }> {
    return runInTransaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          fingerprintId,
          status: UserStatus.ANONYMOUS,
        },
        tx
      );

      const credit = await creditService.initializeCreditWithFree(
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
    return runInTransaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          clerkUserId,
          email,
          fingerprintId,
          status: UserStatus.REGISTERED,
        },
        tx
      );

      const credit = await creditService.initializeCreditWithFree(
        {
          userId: newUser.userId,
          feature: 'user_registration_init',
          creditType: CreditType.FREE,
          operationType: OperationType.RECHARGE,
          creditsUsed: freeRegisterAmount,
        },
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);
      return { newUser, credit };
    });
  }

  // 注意积分审查日志的处理
  async upgradeToRegistered(
    userId: string,
    email: string,
    clerkUserId: string
  ): Promise<{ updateUser: User; credit: Credit; }> {
    return runInTransaction(async (tx) => {
      const updateUser = await userService.upgradeToRegistered(
        userId,
        {
          email,
          clerkUserId
        },
        tx
      );

      // 先清空匿名积分并审计日志留痕
      await creditService.purgeFreeCredit(userId, 'user_registered_purge', tx);
      // 再初始化完成注册获得免费积分
      const credit = await creditService.initializeCreditWithFree(
        {
          userId: updateUser.userId,
          feature: 'user_registration_init',
          creditType: CreditType.FREE,
          operationType: OperationType.RECHARGE,
          creditsUsed: freeRegisterAmount,
        }, 
        tx
      );
      
      return { updateUser: updateUser, credit: credit };
    });
  }

  async hardDeleteUserByClerkId(clerkUserId: string): Promise<string | null> { 
    return runInTransaction(async (tx) => {
      // 根据clerkUserId查找用户
      const user = await userService.findByClerkUserId(clerkUserId, tx);
      if (!user) {
        console.log(`User with clerkUserId ${clerkUserId} not found`);
        return null;
      }
      await this.handleUserUnregister(user.userId, tx);
      return user.userId;
    });
  }

  async handleUserUnregister(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client =  checkAndFallbackWithNonTCClient(tx)
    const user = await userService.findByUserId(userId, client);
    if (!user) {
      return;
    }

    await userService.softDeleteUser(user.userId);

    await creditService.purgeCredit(userId, 'soft_delete_user', client);
    
    const subscription = await subscriptionService.getActiveSubscription(userId, client);
    if (subscription) {
      await subscriptionService.cancelSubscription(subscription.id, true, client);
    }
  }

  private async findUserWithRelations(
    userId: string,
    tx: Prisma.TransactionClient
  ) {
    return tx.user.findUnique({
      where: { userId },
      include: {
        credits: true,
        subscription: true,
        transactions: true,
        creditUsage: true,
      },
    });
  }
}

export const userAggregateService = new UserAggregateService();
