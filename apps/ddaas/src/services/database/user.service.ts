/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Prisma } from '@/db/prisma-model-type';
import type { User } from '@/db/prisma-model-type';
import { UserStatus } from '@/db/constants';
import { checkAndFallbackWithNonTCClient } from '@/db/prisma';

export class UserService {

  // Create user
  async createUser(data: {
    fingerprintId?: string;
    clerkUserId?: string;
    stripeCusId?: string;
    email?: string;
    status?: string;
  }, tx?: Prisma.TransactionClient): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.create({
      data: {
        fingerprintId: data.fingerprintId,
        clerkUserId: data.clerkUserId,
        stripeCusId: data.stripeCusId,
        email: data.email,
        status: data.status || UserStatus.ANONYMOUS,
      },
    });
  }

  // Find user by ID
  async findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        stripeCusId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscription: true,
      },
    });
  }

  // Find user by email
  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findFirst({
      where: { email },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        stripeCusId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscription: true,
      },
    });
  }

  // Find users by Fingerprint ID, fp_id can be used for multi user_ids
  async findListByFingerprintId(fingerprintId: string, tx?: Prisma.TransactionClient): Promise<User[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findMany({
      where: { fingerprintId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        stripeCusId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Find user by Clerk user ID
  async findByClerkUserId(clerkUserId: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        stripeCusId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscription: true,
      },
    });
  }

  // Update user
  async updateUser(
    userId: string,
    data: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data,
    });
  }

  async updateStripeCustomerId(
    userId: string,
    stripeCusId: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: { stripeCusId },
    });
  }

  // Upgrade anonymous user to registered user
  async upgradeToRegistered(
    userId: string,
    data: {
      email: string;
      clerkUserId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: {
        email: data.email,
        clerkUserId: data.clerkUserId,
        status: UserStatus.REGISTERED,
      },
    });
  }

  // Soft delete user (mark as deleted)
  async softDeleteUser(userId: string, tx?: Prisma.TransactionClient): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: {
        status: UserStatus.DELETED,
        email: null,
        clerkUserId: null,
        stripeCusId: null,
      },
    });
  }

  // Get user list
  async listUsers(params: {
    skip?: number;
    take?: number;
    status?: string;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }, tx?: Prisma.TransactionClient): Promise<{ users: User[]; total: number }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const { skip = 0, take = 10, status, orderBy = { createdAt: 'desc' } } = params;

    const where: Prisma.UserWhereInput = status ? { status } : {};

    const [users, total] = await Promise.all([
      client.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          userId: true,
          fingerprintId: true,
          clerkUserId: true,
          stripeCusId: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          credits: true,
        },
      }),
      client.user.count({ where }),
    ]);

    return { users, total };
  }

  // 批量创建匿名用户
  async createBatchAnonymousUsers(
    fingerprintIds: string[],
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const data = fingerprintIds.map((fingerprintId) => ({
      fingerprintId,
      status: UserStatus.ANONYMOUS,
    }));

    const result = await client.user.createMany({
      data,
      skipDuplicates: true,
    });

    return result.count;
  }

  // Check if user exists
  async exists(userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const count = await client.user.count({
      where: { userId },
    });
    return count > 0;
  }

  // Get user statistics
  async getUserStats(tx?: Prisma.TransactionClient): Promise<{
    total: number;
    anonymous: number;
    registered: number;
    frozen: number;
    deleted: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const [total, anonymous, registered, frozen, deleted] = await Promise.all([
      client.user.count(),
      client.user.count({ where: { status: UserStatus.ANONYMOUS } }),
      client.user.count({ where: { status: UserStatus.REGISTERED } }),
      client.user.count({ where: { status: UserStatus.FROZEN } }),
      client.user.count({ where: { status: UserStatus.DELETED } }),
    ]);

    return { total, anonymous, registered, frozen, deleted };
  }
}

export const userService = new UserService();
