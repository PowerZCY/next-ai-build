'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createFingerprintHeaders,
  getOrGenerateFingerprintId
} from './fingerprint-client';
import type {
  FingerprintConfig,
  UseFingerprintResult,
  XCredit,
  XSubscription,
  XUser
} from './types';

/**
 * Hook for managing fingerprint ID and anonymous user data
 * Accepts configuration to customize API endpoint and behavior
 */
export function useFingerprint(config: FingerprintConfig): UseFingerprintResult {
  // 服务端渲染检查
  if (typeof window === 'undefined') {
    return {
      fingerprintId: null,
      xUser: null,
      xCredit: null,
      xSubscription: null,
      isLoading: false,
      isInitialized: false,
      error: 'Server-side rendering is not supported',
      initializeAnonymousUser: async () => {},
      refreshUserData: async () => {},
    };
  }

  const [fingerprintId, setFingerprintIdState] = useState<string | null>(null);
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [xCredit, setXCredit] = useState<XCredit | null>(null);
  const [xSubscription, setXSubscription] = useState<XSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 第一阶段：初始化fingerprint ID
   */
  const initializeFingerprintId = useCallback(async () => {
    try {
      const currentFingerprintId = await getOrGenerateFingerprintId();
      console.log('Initialized fingerprintId:', currentFingerprintId);
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
      console.warn('Cannot initialize user: Fingerprint ID is missing', { fingerprintId, isLoading, isInitialized });
      setError('Cannot initialize user: Missing fingerprint ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing anonymous user with fingerprintId:', fingerprintId);
      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fingerprintHeaders,
        },
        body: JSON.stringify({ fingerprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize anonymous user');
      }

      const data = await response.json();
      console.log('API response in initializeAnonymousUser:', data);

      if (data.success) {
        const updatedXUser = data.xUser || { userId: '', fingerprintId, clerkUserId: '', email: '', status: '', createdAt: '' };
        console.log('Setting xUser:', updatedXUser);
        setXUser(updatedXUser);
        setXCredit(data.xCredit || null);
        setXSubscription(data.xSubscription || null);
        setIsInitialized(true);

        if (data.xUser?.fingerprintId && data.xUser.fingerprintId !== fingerprintId) {
          setFingerprintIdState(data.xUser.fingerprintId);
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
  }, [fingerprintId, config.apiEndpoint]);

  /**
   * 刷新用户数据
   */
  const refreshUserData = useCallback(async () => {
    if (!fingerprintId) {
      console.warn('Cannot refresh user data: Fingerprint ID is missing', { fingerprintId, isLoading, isInitialized });
      setError('Cannot refresh user data: Missing fingerprint ID');
      return;
    }

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
        const updatedXUser = data.xUser || { userId: '', fingerprintId, clerkUserId: '', email: '', status: '', createdAt: '' };
        setXUser(updatedXUser);
        setXCredit(data.xCredit || null);
        setXSubscription(data.xSubscription || null);
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
    if (!fingerprintId) {
      console.warn('Cannot check existing user: Fingerprint ID is missing', { fingerprintId, isLoading, isInitialized });
      return;
    }

    try {
      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(`${config.apiEndpoint}?fingerprintId=${fingerprintId}`, {
        method: 'GET',
        headers: fingerprintHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedXUser = data.xUser || { userId: '', fingerprintId, clerkUserId: '', email: '', status: '', createdAt: '' };
          setXUser(updatedXUser);
          setXCredit(data.xCredit || null);
          setXSubscription(data.xSubscription || null);
          setIsInitialized(true);
        }
      }
    } catch (err) {
      console.error('Failed to check existing user:', err);
    }
  }, [fingerprintId, config.apiEndpoint]);

  // 第一阶段：页面加载完成后生成指纹ID
  useEffect(() => {
    const initFingerprint = async () => {
      setIsLoading(true);
      const currentFingerprintId = await initializeFingerprintId();
      if (currentFingerprintId) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, [initializeFingerprintId]);

  // 第二阶段：有指纹ID后检查现有用户
  useEffect(() => {
    if (!fingerprintId || isInitialized || isLoading) return;
    checkExistingUser();
  }, [fingerprintId, isInitialized, isLoading, checkExistingUser]);

  // 第三阶段：如果没有现有用户且自动初始化开启，则创建新用户
  useEffect(() => {
    if (!fingerprintId || isInitialized || isLoading || error || config.autoInitialize === false) return;
    initializeAnonymousUser();
  }, [fingerprintId, isInitialized, isLoading, error, initializeAnonymousUser, config.autoInitialize]);

  return {
    fingerprintId,
    xUser,
    xCredit,
    xSubscription,
    isLoading,
    isInitialized,
    error,
    initializeAnonymousUser,
    refreshUserData,
  };
}