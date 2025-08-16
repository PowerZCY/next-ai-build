'use client';

import React, { createContext, useContext, useState } from 'react';
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
export function FingerprintStatus() {
  const { 
    fingerprintId, 
    anonymousUser, 
    credits, 
    subscription,
    isLoading, 
    isInitialized, 
    error 
  } = useFingerprintContext();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #9b59b6, #e74c3c)',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <span style={{
          fontSize: '24px',
          color: 'white',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '70px',
              left: '10px',
              background: '#f0f0f0',
              padding: '15px',
              borderRadius: '5px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxWidth: '300px',
              zIndex: 9999,
              border: '1px solid #ccc',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h4 style={{ margin: '0 0 5px 0' }}>Fingerprint Debug</h4>
            <div><strong>FP_ID:</strong> {fingerprintId || 'None'}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</div>
            {error && <div style={{ color: 'red' }}><strong>Error:</strong> {error}</div>}
            {anonymousUser && (
              <div>
                <strong>user_id:</strong> {anonymousUser.userId} <br/>
                <strong>clerk_user_id:</strong> {anonymousUser.clerkUserId || 'None'} <br/>
                <strong>email:</strong> {anonymousUser.email || 'None'} <br/>
              </div>
            )}
            {credits && (
              <div>
                <strong>Credits:</strong> {credits.balanceFree} Free + {credits.balancePaid} Paid = {credits.totalBalance} Total
              </div>
            )}
            {subscription && (
              <div>
                <strong>user_id:</strong> {subscription.userId} <br/>
                <strong>pay_subscription_id:</strong> {subscription.paySubscriptionId} <br/>
                <strong>price_id:</strong> {subscription.priceId || 'None'} <br/>
                <strong>price_name:</strong> {subscription.priceName || 'None'} <br/>
                <strong>status:</strong> {subscription.status || 'Free'} <br/>
                <strong>credits_allocated:</strong> {subscription.creditsAllocated || ''} <br/>
                <strong>sub_period_start:</strong> {subscription.subPeriodStart || ''} <br/>
                <strong>sub_period_end:</strong> {subscription.subPeriodEnd || ''} <br/>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}