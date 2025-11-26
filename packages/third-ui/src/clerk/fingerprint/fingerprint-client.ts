/**
 * Fingerprint Client Utilities
 * 客户端专用的指纹生成和管理逻辑
 * 只能在浏览器环境中使用
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { FINGERPRINT_COOKIE_NAME, FINGERPRINT_HEADER_NAME, FINGERPRINT_SOURCE_REFER, FINGERPRINT_STORAGE_KEY, isValidFingerprintId } from './fingerprint-shared';

/**
 * 检查浏览器存储（localStorage 和 cookie）中的指纹 ID
 * 返回有效的 ID 或 null
 */
function checkStoredFingerprintId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // 优先检查 localStorage
  const localStorageId = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (localStorageId && isValidFingerprintId(localStorageId)) {
    return localStorageId;
  }

  // 检查 cookie
  const cookieId = getCookieValue(FINGERPRINT_COOKIE_NAME);
  if (cookieId && isValidFingerprintId(cookieId)) {
    // 同步到 localStorage
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, cookieId);
    return cookieId;
  }

  return null;
}

/**
 * 生成基于真实浏览器特征的fingerprint ID
 * 使用 FingerprintJS 收集浏览器特征并生成唯一标识
 */
export async function generateFingerprintId(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateFingerprintId can only be used in browser environment');
  }

  // 检查现有 ID
  const existingId = checkStoredFingerprintId();
  if (existingId) {
    console.log('Using existing fingerprint ID:', existingId);
    return existingId;
  }

  try {
    // 使用 FingerprintJS 生成指纹
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprintId = `fp_${result.visitorId}`;

    // 存储到 localStorage 和 cookie
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprintId);
    setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365);

    console.log('Generated new fingerprint ID:', fingerprintId);
    return fingerprintId;
  } catch (error) {
    console.warn('Failed to generate fingerprint with FingerprintJS:', error);
    // 降级方案：生成基于时间戳和随机数的 ID
    const fallbackId = `fp_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fallbackId);
    setCookie(FINGERPRINT_COOKIE_NAME, fallbackId, 365);

    console.log('Generated fallback fingerprint ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * 获取当前的fingerprint ID
 */
export function getFingerprintId(): string | null {
  return checkStoredFingerprintId();
}

/**
 * 设置fingerprint ID到存储
 */
export function setFingerprintId(fingerprintId: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setFingerprintId can only be used in browser environment');
  }

  if (!isValidFingerprintId(fingerprintId)) {
    throw new Error('Invalid fingerprint ID');
  }

  localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprintId);
  setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365);
}

/**
 * 清除fingerprint ID
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
 */
export async function getOrGenerateFingerprintId(): Promise<string> {
  const existingId = checkStoredFingerprintId();
  if (existingId) {
    console.log('Retrieved existing fingerprint ID:', existingId);
    return existingId;
  }

  return await generateFingerprintId();
}

/**
 * 创建包含fingerprint ID的fetch headers
 */
export async function createFingerprintHeaders(): Promise<Record<string, string>> {
  const fingerprintId = await getOrGenerateFingerprintId();
  return {
    [FINGERPRINT_HEADER_NAME]: fingerprintId,
  };
}

/**
 * Hook for generating fingerprint headers
 */
export function useFingerprintHeaders(): () => Promise<Record<string, string>> {
  return createFingerprintHeaders;
}

/**
 * Create a fetch wrapper that automatically includes fingerprint headers
 */
export function createFingerprintFetch() {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const fingerprintHeaders = await createFingerprintHeaders();
    const headers = {
      ...fingerprintHeaders,
      [FINGERPRINT_SOURCE_REFER]: document.referrer || '',
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