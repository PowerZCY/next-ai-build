import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// ==================== 日志配置 ====================
const getLogConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'development':
      return [
        { emit: 'event' as const, level: 'query' as const },
        { emit: 'stdout' as const, level: 'info' as const },
        { emit: 'stdout' as const, level: 'warn' as const },
        { emit: 'stdout' as const, level: 'error' as const },
      ];
    case 'test':
      return [
        { emit: 'stdout' as const, level: 'warn' as const },
        { emit: 'stdout' as const, level: 'error' as const },
      ];
    default:
      return [{ emit: 'stdout' as const, level: 'error' as const }];
  }
};

const logConfig = getLogConfig();

// ==================== 创建 Prisma 全局单例 ====================
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ==================== 便捷方法, 入参事务客户端不存在或者不传, 就返回全局非事务客户端 ====================
export function checkAndFallbackWithNonTCClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | PrismaClient {
  return tx ?? prisma;
}
