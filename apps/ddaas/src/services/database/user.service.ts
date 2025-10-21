/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { UserStatus } from '@/db/constants';

const prisma = new PrismaClient();

export class UserService {
  // Create user
  async createUser(data: {
    fingerprintId?: string;
    clerkUserId?: string;
    email?: string;
    status?: string;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        fingerprintId: data.fingerprintId,
        clerkUserId: data.clerkUserId,
        email: data.email,
        status: data.status || UserStatus.ANONYMOUS,
      },
    });
  }

  // Find user by ID
  async findByUserId(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Find users by Fingerprint ID, fp_id can be used for multi user_ids
  async findListByFingerprintId(fingerprintId: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: { fingerprintId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
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
  async findByClerkUserId(clerkUserId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        userId: true,
        fingerprintId: true,
        clerkUserId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        credits: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  // Update user
  async updateUser(
    userId: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return await prisma.user.update({
      where: { userId },
      data,
    });
  }

  // Upgrade anonymous user to registered user
  async upgradeToRegistered(
    userId: string,
    data: {
      email: string;
      clerkUserId: string;
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { userId },
      data: {
        email: data.email,
        clerkUserId: data.clerkUserId,
        status: UserStatus.REGISTERED,
      },
    });
  }

  // Soft delete user (mark as deleted)
  async softDeleteUser(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { userId },
      data: {
        status: UserStatus.DELETED,
        email: null,
        clerkUserId: null,
      },
    });
  }

  // Hard delete user (permanent deletion)
  async hardDeleteUser(userId: string): Promise<void> {
    // Backup user data before deletion
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        credits: true,
        subscriptions: true,
        transactions: true,
        creditUsage: true,
      },
    });

    if (user) {
      // Backup user data to UserBackup table
      await prisma.userBackup.create({
        data: {
          originalUserId: user.userId,
          fingerprintId: user.fingerprintId,
          clerkUserId: user.clerkUserId,
          email: user.email,
          status: user.status,
          backupData: user as any,
        },
      });

      // Delete user (cascading delete will automatically delete associated data)
      await prisma.user.delete({
        where: { userId },
      });
    }
  }

  // Get user list
  async listUsers(params: {
    skip?: number;
    take?: number;
    status?: string;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: User[]; total: number }> {
    const { skip = 0, take = 10, status, orderBy = { createdAt: 'desc' } } = params;

    const where: Prisma.UserWhereInput = status ? { status } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          userId: true,
          fingerprintId: true,
          clerkUserId: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          credits: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  // 批量创建匿名用户
  async createBatchAnonymousUsers(
    fingerprintIds: string[]
  ): Promise<number> {
    const data = fingerprintIds.map((fingerprintId) => ({
      fingerprintId,
      status: UserStatus.ANONYMOUS,
    }));

    const result = await prisma.user.createMany({
      data,
      skipDuplicates: true,
    });

    return result.count;
  }

  // Check if user exists
  async exists(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { userId },
    });
    return count > 0;
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    anonymous: number;
    registered: number;
    frozen: number;
    deleted: number;
  }> {
    const [total, anonymous, registered, frozen, deleted] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ANONYMOUS } }),
      prisma.user.count({ where: { status: UserStatus.REGISTERED } }),
      prisma.user.count({ where: { status: UserStatus.FROZEN } }),
      prisma.user.count({ where: { status: UserStatus.DELETED } }),
    ]);

    return { total, anonymous, registered, frozen, deleted };
  }
}

export const userService = new UserService();