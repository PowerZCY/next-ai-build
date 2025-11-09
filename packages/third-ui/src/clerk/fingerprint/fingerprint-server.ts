/**
 * Fingerprint Server Utilities
 * 服务端专用的指纹ID提取和验证逻辑
 * 可以安全地在服务端使用，不依赖浏览器API或FingerprintJS
 */

import {
  FINGERPRINT_HEADER_NAME,
  FINGERPRINT_COOKIE_NAME,
  isValidFingerprintId,
} from './fingerprint-shared';

/**
 * 从请求中提取fingerprint ID
 * 优先级：header > cookie > query参数
 * 可以安全地在服务端使用
 */
export function extractFingerprintId(
  headers: Headers | Record<string, string>,
  cookies?: Record<string, string>,
  query?: Record<string, string | undefined>
): string | null {
  // 1. 从header中获取
  const headerValue = headers instanceof Headers 
    ? headers.get(FINGERPRINT_HEADER_NAME)
    : headers[FINGERPRINT_HEADER_NAME];
  
  if (headerValue && isValidFingerprintId(headerValue)) {
    return headerValue;
  }

  // 2. 从cookie中获取
  if (cookies) {
    const cookieValue = cookies[FINGERPRINT_COOKIE_NAME];
    if (cookieValue && isValidFingerprintId(cookieValue)) {
      return cookieValue;
    }
  }

  // 3. 从query参数中获取
  if (query) {
    const queryValue = query.fingerprint_id || query.fp_id;
    if (queryValue && isValidFingerprintId(queryValue)) {
      return queryValue;
    }
  }

  return null;
}

/**
 * 生成服务端降级fingerprint ID
 * 当客户端无法生成fingerprint时使用
 * 可以安全地在服务端使用
 */
export function generateServerFingerprintId(): string {
  return `fp_server_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 从Next.js Request对象中提取fingerprint ID
 * 便捷方法，适用于Next.js API路由
 */
export function extractFingerprintFromNextRequest(request: Request): string | null {
  const headers = request.headers;
  
  // 尝试从cookies获取（需要解析cookie header）
  const cookieHeader = headers.get('cookie');
  const cookies: Record<string, string> = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }

  // 尝试从URL query参数获取
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return extractFingerprintId(headers, cookies, query);
}

type NextHeadersLike = Pick<Headers, 'forEach'>;
type NextCookiesLike = {
  getAll(): Array<{ name: string; value: string }>;
};

/**
 * 从Next.js runtime提供的headers/cookies实例里提取fingerprint ID
 * 供App Router服务端组件和Server Actions直接复用
 */
export function extractFingerprintFromNextStores(params: {
  headers: NextHeadersLike;
  cookies: NextCookiesLike;
}): string | null {
  const cookieMap = params.cookies
    .getAll()
    .reduce<Record<string, string>>((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {});

  const headerMap: Record<string, string> = {};
  params.headers.forEach((value, key) => {
    headerMap[key] = value;
  });

  return extractFingerprintId(headerMap, cookieMap);
}
