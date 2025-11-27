import { PrismaClient, Prisma } from '@prisma/client';

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
    console.log(`Prisma Query Logger Already Registered | ID: ${globalForPrisma[ID_KEY]}`);
  } else {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    globalForPrisma[ID_KEY] = listenerId;

    // --- 自定义SQL拼接 ---
    const interpolate = (query: string, params: string) => {
      // 1. 【核心修改】：安全检查和参数解析
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parameters: any[] = [];
      try {
        // 尝试解析 params 字符串
        // 如果 params 是空字符串 ""，或者不是有效的 JSON，这里会捕获错误
        parameters = params && params.length > 0 ? JSON.parse(params) : [];
        // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (e) {
        // 如果无法解析，则直接返回原始查询，跳过替换
        return query; 
      }
      
      // 确保 parameters 是一个数组
      if (!Array.isArray(parameters)) {
          console.warn('Prisma params解析结果不是数组，跳过参数替换。Result:', parameters);
          return query;
      }

      // 如果没有参数，直接返回查询
      if (parameters.length === 0) {
        return query;
      }

      // 2. 将参数列表的值进行安全的字符串化处理
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeValues = parameters.map((p: any) => {
        if (p === null) return 'NULL';
        // 对字符串类型的值加上单引号并转义（这是SQL安全的关键）
        if (typeof p === 'string') return `'${p.replace(/'/g, "''")}'`; 
        return p; // 数字、布尔值等直接返回
      });

      // 3. 循环替换 $1, $2, ...
      let sql = query;
      for (let i = 0; i < safeValues.length; i++) {
        const placeholder = new RegExp('\\$' + (i + 1) + '(?!\\d)', 'g');
        sql = sql.replace(placeholder, safeValues[i]);
      }
      return sql;
    };

    const wrappedHandler = (event: Prisma.QueryEvent) => {
      const ms = event.duration;
      const slow = ms >= 200 ? '🐌 SLOW SQL ' : '🚀 SQL';

      const interpolatedSql = interpolate(event.query, event.params);
      
      const clean = interpolatedSql
        .replace(/"[^"]+"\./g, '')           // 去 "表".
        .replace(/= '([^']+)'/g, `= '$1'`)   // 已经替换成单引号，此处可以优化
        .replace(/"/g, '');                  // 彻底灭双引号

      console.log('─'.repeat(60));
      console.log(`${clean};`);
      console.log(`⏰ 耗时: ${ms}ms, ${slow}`);
    };
    // 注册包装后的 handler
    prisma.$on('query' as never, wrappedHandler);

    globalForPrisma[REGISTERED_KEY] = true;
  }
}

// ==================== 便捷方法, 入参事务客户端不存在或者不传, 就返回全局非事务客户端 ====================
export function checkAndFallbackWithNonTCClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | PrismaClient {
  return tx ?? prisma;
}
