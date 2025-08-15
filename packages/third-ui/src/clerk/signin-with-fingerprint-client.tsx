'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useFingerprintContextSafe } from './fingerprint/fingerprint-provider';

/**
 * SignIn component with fingerprint awareness
 * 如果没有FingerprintProvider，会优雅降级为普通SignIn组件
 * 如果有FingerprintProvider，会处理fingerprint相关逻辑
 */
export function SignInWithFingerprint() {
  const fingerprintContext = useFingerprintContextSafe();
  
  // 如果没有fingerprint context，使用默认值
  const { 
    fingerprintId = null, 
    anonymousUser = null, 
    isInitialized = false,
    initializeAnonymousUser = async () => {}
  } = fingerprintContext || {};

  // 准备传递给Clerk的metadata，包含匿名用户信息
  const unsafeMetadata = {
    user_id: anonymousUser?.userId || null,        // 数据库中的user_id
    fingerprint_id: fingerprintId || null,        // 浏览器指纹ID
  };

  // 确保匿名用户已初始化
  useEffect(() => {
    if (!isInitialized && fingerprintId) {
      initializeAnonymousUser();
    }
  }, [fingerprintId, isInitialized, initializeAnonymousUser]);

  // 调试日志和处理登录逻辑
  useEffect(() => {
    console.log('SignInWithFingerprint Debug:', {
      fingerprintProvider: fingerprintContext ? 'Available' : 'Not found',
      fingerprintId: fingerprintId || 'Not generated',
      anonymousUser: anonymousUser ? 'Initialized' : 'Not initialized',
      clerkMetadata: unsafeMetadata
    });

    if (anonymousUser && fingerprintId) {
      console.log('User signed in with existing anonymous data:', {
        anonymousUserId: anonymousUser.userId,
        fingerprintId,
      });
      // TODO: 实现数据合并逻辑
    }
  }, [anonymousUser, fingerprintId, fingerprintContext, unsafeMetadata]);

  return <SignIn unsafeMetadata={unsafeMetadata} />;
}

