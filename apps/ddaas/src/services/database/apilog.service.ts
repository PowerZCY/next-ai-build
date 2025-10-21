/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient } from '@prisma/client';
import type { Apilog } from '@prisma/client';

const prisma = new PrismaClient();

export type ApiType = 'from_clerk_in' | 'to_clerk_out' | 'from_stripe_in' | 'to_stripe_out';

export interface CreateApiLogData {
  methodName: string;
  request?: any;
  summary?: any;
  apiType: ApiType;
}

export class ApilogService {
  // Create API log record with request
  async createApilog(data: CreateApiLogData): Promise<string> {
    const log = await prisma.apilog.create({
      data: {
        methodName: data.methodName,
        request: data.request ? JSON.stringify(data.request) : null,
        summary: data.summary ? JSON.stringify(data.summary) : null,
        apiType: data.apiType,
      },
    });
    return log.id.toString();
  }

  // Update API log record with response
  async updateApilogResponse(logId: string, response: any): Promise<void> {
    await prisma.apilog.update({
      where: { id: BigInt(logId) },
      data: {
        response: response ? JSON.stringify(response) : null,
      },
    });
  }

  // Get API log by ID
  async getApilog(logId: string): Promise<Apilog | null> {
    return await prisma.apilog.findUnique({
      where: { id: BigInt(logId) },
    });
  }

  // Get API logs with filters
  async getApilogList(params: {
    apiType?: ApiType;
    methodName?: string;
    limit?: number;
    offset?: number;
  }): Promise<Apilog[]> {
    const { apiType, methodName, limit = 50, offset = 0 } = params;

    return await prisma.apilog.findMany({
      where: {
        ...(apiType && { apiType }),
        ...(methodName && { methodName: { contains: methodName } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // Delete old API logs (cleanup)
  async deleteOldLogList(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.apilog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // Get API log statistics
  async getApilogStats(): Promise<{
    totalLogs: number;
    clerkIncoming: number;
    clerkOutgoing: number;
    stripeIncoming: number;
    stripeOutgoing: number;
  }> {
    const [total, clerkIn, clerkOut, stripeIn, stripeOut] = await Promise.all([
      prisma.apilog.count(),
      prisma.apilog.count({ where: { apiType: 'from_clerk_in' } }),
      prisma.apilog.count({ where: { apiType: 'to_clerk_out' } }),
      prisma.apilog.count({ where: { apiType: 'from_stripe_in' } }),
      prisma.apilog.count({ where: { apiType: 'to_stripe_out' } }),
    ]);

    return {
      totalLogs: total,
      clerkIncoming: clerkIn,
      clerkOutgoing: clerkOut,
      stripeIncoming: stripeIn,
      stripeOutgoing: stripeOut,
    };
  }
}

// API Logger Helper Class for convenience
export class Apilogger {
  static async createLogAsync(data: CreateApiLogData): Promise<string | null> {
    try {
      return await apilogService.createApilog(data);
    } catch (error) {
      console.error('Failed to create API log:', error);
      return null;
    }
  }

  static async updateResponseAsync(logId: string, response: any): Promise<void> {
    try {
      setImmediate(async () => {
        try {
          await apilogService.updateApilogResponse(logId, response);
        } catch (error) {
          console.error('Failed to update API log response:', error);
        }
      });
    } catch (error) {
      console.error('Failed to queue API log update:', error);
    }
  }

  static async logClerkIncoming(methodName: string, summary?: any, originalRequest?: any): Promise<string | null> {
    return await this.createLogAsync({
      methodName,
      request: originalRequest,
      summary,
      apiType: 'from_clerk_in',
    });
  }

  static async logClerkOutgoing(methodName: string, request?: any, summary?: any): Promise<string | null> {
    return await this.createLogAsync({
      methodName,
      request,
      summary,
      apiType: 'to_clerk_out',
    });
  }

  static async logStripeIncoming(methodName: string, summary?: any, originalRequest?: any): Promise<string | null> {
    return await this.createLogAsync({
      methodName,
      request: originalRequest,
      summary,
      apiType: 'from_stripe_in',
    });
  }

  static async logStripeOutgoing(methodName: string, request?: any, summary?: any): Promise<string | null> {
    return await this.createLogAsync({
      methodName,
      request,
      summary,
      apiType: 'to_stripe_out',
    });
  }

  static updateResponse(logId: string | null, response: any): void {
    if (logId) {
      this.updateResponseAsync(logId, response);
    }
  }
}

export const apilogService = new ApilogService();