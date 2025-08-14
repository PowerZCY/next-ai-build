'use client';

import React, { createContext, useContext } from 'react';
import { useFingerprint } from './use-fingerprint';
import type { 
  FingerprintContextType, 
  FingerprintProviderProps 
} from './types';

const FingerprintContext = createContext<FingerprintContextType | undefined>(undefined);

/**
 * Fingerprint Provider Component
 * 为应用提供fingerprint和匿名用户管理功能
 */
export function FingerprintProvider({ 
  children,
  config
}: FingerprintProviderProps) {
  const fingerprintData = useFingerprint(config);

  return (
    <FingerprintContext.Provider value={fingerprintData}>
      {children}
    </FingerprintContext.Provider>
  );
}

/**
 * Hook to use fingerprint context
 */
export function useFingerprintContext(): FingerprintContextType {
  const context = useContext(FingerprintContext);
  if (context === undefined) {
    throw new Error('useFingerprintContext must be used within a FingerprintProvider');
  }
  return context;
}

/**
 * Safe hook to use fingerprint context - returns null if no provider
 * 安全版本的fingerprint context hook - 如果没有Provider则返回null
 */
export function useFingerprintContextSafe(): FingerprintContextType | null {
  const context = useContext(FingerprintContext);
  return context || null;
}

/**
 * HOC for components that need fingerprint functionality
 * Note: This HOC now requires config to be passed externally
 */
export function withFingerprint<P extends object>(
  Component: React.ComponentType<P>,
  config: FingerprintProviderProps['config']
) {
  return function FingerprintWrappedComponent(props: P) {
    return (
      <FingerprintProvider config={config}>
        <Component {...props} />
      </FingerprintProvider>
    );
  };
}

/**
 * 组件：显示用户状态和积分信息（用于调试）
 */
export function FingerprintDebugInfo() {
  const { 
    fingerprintId, 
    anonymousUser, 
    credits, 
    isLoading, 
    isInitialized, 
    error 
  } = useFingerprintContext();

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#f0f0f0',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 9999,
      border: '1px solid #ccc'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Fingerprint Debug</h4>
      <div><strong>FP ID:</strong> {fingerprintId || 'None'}</div>
      <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
      <div><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</div>
      {error && <div style={{ color: 'red' }}><strong>Error:</strong> {error}</div>}
      {anonymousUser && (
        <div>
          <strong>User ID:</strong> {anonymousUser.userId.slice(0, 8)}...
        </div>
      )}
      {credits && (
        <div>
          <strong>Credits:</strong> {credits.balanceFree}F + {credits.balancePaid}P = {credits.totalBalance}
        </div>
      )}
    </div>
  );
}