'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useFingerprint } from './use-fingerprint';
import { globalLucideIcons } from '@base-ui/components/global-icon';
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
    xUser, 
    xCredit, 
    xSubscription,
    isLoading, 
    isInitialized, 
    error 
  } = useFingerprintContext();

  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // ESC键关闭弹框
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

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
        <globalLucideIcons.BTC 
          size={24}
          style={{
            color: 'white',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            onClick={handleBackdropClick}
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
            ref={modalRef}
            style={{
              position: 'fixed',
              top: '70px',
              left: '10px',
              background: '#f0f0f0',
              padding: '15px',
              borderRadius: '5px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxWidth: '500px',
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
            {xUser && (
              <div>
                <strong>user_id:</strong> {xUser.userId} <br/>
                <strong>clerk_user_id:</strong> {xUser.clerkUserId || 'None'} <br/>
                <strong>email:</strong> {xUser.email || 'None'} <br/>
              </div>
            )}
            {xCredit && (
              <div>
                <strong>Credits:</strong> {xCredit.balanceFree} Free + {xCredit.balancePaid} Paid = {xCredit.totalBalance} Total
              </div>
            )}
            <div>
              {xSubscription ? (
                <>
                  <strong>user_id:</strong> {xSubscription.userId} <br/>
                  <strong>pay_subscription_id:</strong> {xSubscription.paySubscriptionId} <br/>
                  <strong>price_id:</strong> {xSubscription.priceId || 'None'} <br/>
                  <strong>price_name:</strong> {xSubscription.priceName || 'None'} <br/>
                  <strong>status:</strong> {xSubscription.status || 'Free'} <br/>
                  <strong>credits_allocated:</strong> {xSubscription.creditsAllocated || ''} <br/>
                  <strong>sub_period_start:</strong> {xSubscription.subPeriodStart || ''} <br/>
                  <strong>sub_period_end:</strong> {xSubscription.subPeriodEnd || ''} <br/>
                </>
              ) : (
                <strong>No Subscription, Default as Hobby Plan</strong>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}