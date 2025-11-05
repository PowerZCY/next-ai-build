import { PrismaClient, Prisma } from '@prisma/client';
import { createPrismaQueryEventHandler } from 'prisma-query-log';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __prisma_query_logger_registered?: boolean;
  __prisma_query_logger_id?: string;
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
  new PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>({
    log: logConfig,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  const REGISTERED_KEY = '__prisma_query_logger_registered';
  const ID_KEY = '__prisma_query_logger_id';
  if (globalForPrisma[REGISTERED_KEY]) {
    // 已注册，打印现有 ID
    console.log(`Prisma Query Logger Already Registered | ID: ${globalForPrisma[ID_KEY]}`);
  } else {
    // 生成唯一 ID（时间戳 + 随机数）
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    globalForPrisma[ID_KEY] = listenerId;

    prisma.$on('query' as never, createPrismaQueryEventHandler({
      format: false,
      language: 'sql',
      queryDuration: false, 
      logger: (sql: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ms = (prisma.$on as any).lastEvent?.duration ?? 0;
        const slow = ms >= 200 ? '🐌 SLOW QUERY! ' : '🚀 QUERY';
        const clean = sql
          .replace(/"[^"]+"\./g, '')           // 去 "表".
          .replace(/= "([^"]+)"/g, `= '$1'`)   // 值换单引号
          .replace(/"/g, '');                  // ← 彻底灭双引号
        
        console.log('─'.repeat(60));
        console.log(`${clean};`);
        console.log(`⏰ 耗时: ${ms}ms, ${slow}`);
        console.log('─'.repeat(60));
      },
    }))

    // 标记已注册
    globalForPrisma[REGISTERED_KEY] = true;

  }
  
};

// ==================== 便捷方法, 入参事务客户端不存在或者不传, 就返回全局非事务客户端 ====================
export function checkAndFallbackWithNonTCClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | PrismaClient {
  return tx ?? prisma;
}
