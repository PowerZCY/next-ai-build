/**
 * Fingerprint Shared Utilities
 * 客户端和服务端共享的常量、类型和验证逻辑
 */

// Fingerprint ID的存储键和header名
export const FINGERPRINT_STORAGE_KEY = 'diaomao_fingerprint_id';
export const FINGERPRINT_HEADER_NAME = 'x-fingerprint-id';
export const FINGERPRINT_COOKIE_NAME = 'fingerprint_id';

/**
 * 验证fingerprint ID格式
 * 可以在客户端和服务端使用
 */
export function isValidFingerprintId(fingerprintId: string): boolean {
  if (!fingerprintId) return false;
  // 支持多种格式：
  // - fp_ + FingerprintJS visitorId (变长字符串)
  // - fp_fallback_ + 时间戳_随机字符串 (客户端降级方案)
  // - fp_server_ + 时间戳_随机字符串 (服务端降级)
  return /^fp(_fallback|_server)?_[a-zA-Z0-9_]+$/.test(fingerprintId);
}

// 常量导出
export const FINGERPRINT_CONSTANTS = {
  STORAGE_KEY: FINGERPRINT_STORAGE_KEY,
  HEADER_NAME: FINGERPRINT_HEADER_NAME,
  COOKIE_NAME: FINGERPRINT_COOKIE_NAME,
} as const;