/**
 * Fingerprint Client Utilities
 * 客户端专用的指纹生成和管理逻辑
 * 只能在浏览器环境中使用
 */

import { 
  FINGERPRINT_STORAGE_KEY, 
  FINGERPRINT_COOKIE_NAME, 
  isValidFingerprintId 
} from './fingerprint-shared';

// Dynamic import to avoid SSR issues
let FingerprintJS: any = null;

/**
 * 生成基于真实浏览器特征的fingerprint ID
 * 使用FingerprintJS收集浏览器特征并生成唯一标识
 * 只能在客户端使用
 */
export async function generateFingerprintId(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateFingerprintId can only be used in browser environment');
  }

  // 首先检查现有ID
  const existingId = getFingerprintId();
  if (existingId && isValidFingerprintId(existingId)) {
    return existingId;
  }

  // 检查cookie
  const cookieId = getCookieValue(FINGERPRINT_COOKIE_NAME);
  if (cookieId && isValidFingerprintId(cookieId)) {
    // 同步到localStorage
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, cookieId);
    return cookieId;
  }

  try {
    // 等待FingerprintJS加载完成
    if (!FingerprintJS) {
      const module = await import('@fingerprintjs/fingerprintjs');
      FingerprintJS = module.default;
    }

    // 使用FingerprintJS生成基于浏览器特征的指纹
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprintId = `fp_${result.visitorId}`;

    // 存储到localStorage和cookie
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprintId);
    setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365); // 365天过期

    return fingerprintId;
  } catch (error) {
    console.warn('Failed to generate fingerprint with FingerprintJS:', error);
    // 降级方案：生成时间戳+随机数
    const fallbackId = `fp_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fallbackId);
    setCookie(FINGERPRINT_COOKIE_NAME, fallbackId, 365);
    
    return fallbackId;
  }
}

/**
 * 获取当前的fingerprint ID
 * 只能在客户端使用
 */
export function getFingerprintId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // 首先检查localStorage
  const localStorageId = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (localStorageId) {
    return localStorageId;
  }

  // 检查cookie
  const cookieId = getCookieValue(FINGERPRINT_COOKIE_NAME);
  if (cookieId) {
    // 同步到localStorage
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, cookieId);
    return cookieId;
  }

  return null;
}

/**
 * 设置fingerprint ID到存储
 * 只能在客户端使用
 */
export function setFingerprintId(fingerprintId: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setFingerprintId can only be used in browser environment');
  }

  localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprintId);
  setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365);
}

/**
 * 清除fingerprint ID
 * 只能在客户端使用
 */
export function clearFingerprintId(): void {
  if (typeof window === 'undefined') {
    throw new Error('clearFingerprintId can only be used in browser environment');
  }

  localStorage.removeItem(FINGERPRINT_STORAGE_KEY);
  deleteCookie(FINGERPRINT_COOKIE_NAME);
}

/**
 * 获取或生成fingerprint ID
 * 如果不存在则自动生成新的
 * 只能在客户端使用
 */
export async function getOrGenerateFingerprintId(): Promise<string> {
  const existingId = getFingerprintId();
  if (existingId) {
    return existingId;
  }
  return await generateFingerprintId();
}

/**
 * 创建包含fingerprint ID的fetch headers
 * 只能在客户端使用
 */
export async function createFingerprintHeaders(): Promise<Record<string, string>> {
  const fingerprintId = await getOrGenerateFingerprintId();
  return {
    'x-fingerprint-id': fingerprintId,
  };
}

/**
 * Hook for generating fingerprint headers
 * 只能在客户端使用
 */
export function useFingerprintHeaders(): () => Promise<Record<string, string>> {
  return createFingerprintHeaders;
}

/**
 * Create a fetch wrapper that automatically includes fingerprint headers
 * 只能在客户端使用
 */
export function createFingerprintFetch() {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const fingerprintHeaders = await createFingerprintHeaders();
    const headers = {
      ...fingerprintHeaders,
      ...(init?.headers || {}),
    };

    return fetch(url, {
      ...init,
      headers,
    });
  };
}

// Cookie 辅助函数 (私有)
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}