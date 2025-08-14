'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getOrGenerateFingerprintId, 
  setFingerprintId,
  createFingerprintHeaders
} from './fingerprint-client';
import type { 
  AnonymousUser, 
  Credits, 
  UseFingerprintResult, 
  FingerprintConfig 
} from './types';

/**
 * Hook for managing fingerprint ID and anonymous user data
 * Accepts configuration to customize API endpoint and behavior
 */
export function useFingerprint(config: FingerprintConfig): UseFingerprintResult {
  const [fingerprintId, setFingerprintIdState] = useState<string | null>(null);
  const [anonymousUser, setAnonymousUser] = useState<AnonymousUser | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 第一阶段：初始化fingerprint ID
   */
  const initializeFingerprintId = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    try {
      // 优先检查现有ID, 没有就生成新的fingerprint ID
      const currentFingerprintId = await getOrGenerateFingerprintId();
      setFingerprintIdState(currentFingerprintId);
      return currentFingerprintId;
    } catch (error) {
      console.error('Failed to initialize fingerprint ID:', error);
      setError('Failed to generate fingerprint ID');
      return null;
    }
  }, []);

  /**
   * 第二阶段：初始化匿名用户
   */
  const initializeAnonymousUser = useCallback(async () => {
    if (!fingerprintId) {
      console.warn('Cannot initialize user without fingerprint ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fingerprintHeaders,
        },
        body: JSON.stringify({
          fingerprintId: fingerprintId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize anonymous user');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnonymousUser(data.user);
        setCredits(data.credits);
        setIsInitialized(true);
        
        // 确保fingerprint ID同步
        if (data.user.fingerprintId !== fingerprintId) {
          setFingerprintId(data.user.fingerprintId);
          setFingerprintIdState(data.user.fingerprintId);
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Failed to initialize anonymous user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [fingerprintId]);

  /**
   * 刷新用户数据
   */
  const refreshUserData = useCallback(async () => {
    if (!fingerprintId) return;

    try {
      setError(null);

      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(`${config.apiEndpoint}?fingerprintId=${fingerprintId}`, {
        method: 'GET',
        headers: fingerprintHeaders,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 用户不存在，需要重新初始化
          await initializeAnonymousUser();
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnonymousUser(data.user);
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fingerprintId, initializeAnonymousUser, config.apiEndpoint]);

  /**
   * 检查现有用户数据（仅在有fingerprint ID时执行）
   */
  const checkExistingUser = useCallback(async () => {
    if (!fingerprintId) return;

    try {
      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(`${config.apiEndpoint}?fingerprintId=${fingerprintId}`, {
        method: 'GET',
        headers: fingerprintHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnonymousUser(data.user);
          setCredits(data.credits);
          setIsInitialized(true);
        }
      }
    } catch (err) {
      console.error('Failed to check existing user:', err);
    }
  }, [fingerprintId, config.apiEndpoint]);

  // 第一阶段：页面加载完成后生成指纹ID
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initFingerprint = async () => {
      await initializeFingerprintId();
      setIsLoading(false); // 第一阶段完成，结束加载状态
    };

    initFingerprint();
  }, [initializeFingerprintId]);

  // 第二阶段：有指纹ID后检查现有用户
  useEffect(() => {
    if (!fingerprintId || isInitialized) return;

    checkExistingUser();
  }, [fingerprintId, isInitialized, checkExistingUser]);

  // 第三阶段：如果没有现有用户且自动初始化开启，则创建新用户
  useEffect(() => {
    if (!fingerprintId || isInitialized || isLoading || error) return;
    if (config.autoInitialize === false) return;

    initializeAnonymousUser();
  }, [fingerprintId, isInitialized, isLoading, error, initializeAnonymousUser, config.autoInitialize]);

  return {
    fingerprintId,
    anonymousUser,
    credits,
    isLoading,
    isInitialized,
    error,
    initializeAnonymousUser,
    refreshUserData,
  };
}

// createFingerprintFetch moved to fingerprint.ts