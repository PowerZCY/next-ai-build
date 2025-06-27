'use client';

import { clerkIntl } from '@third-ui/lib/clerk-intl';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

interface ClerkProviderClientProps {
  children: React.ReactNode;
  locale: string;
  signInUrl?: string;
  signUpUrl?: string;
  fallbackSignInUrl?: string;
  fallbackSignUpUrl?: string;
  waitlistUrl?: string;
}

export function ClerkProviderClient({
  children,
  locale,
  signInUrl,
  signUpUrl,
  fallbackSignInUrl,
  fallbackSignUpUrl,
  waitlistUrl,
}: ClerkProviderClientProps) {
  const currentLocalization = clerkIntl[locale as keyof typeof clerkIntl];

  // build the ClerkProvider props, only add when the parameter is not empty
  const clerkProviderProps: Record<string, any> = {
    localization: currentLocalization,
  };

  // 只有传入参数非空时才拼接 URL 并添加对应的属性
  if (signInUrl) {
    clerkProviderProps.signInUrl = `/${locale}${signInUrl}`;
  }
  if (signUpUrl) {
    clerkProviderProps.signUpUrl = `/${locale}${signUpUrl}`;
  }
  if (fallbackSignInUrl) {
    clerkProviderProps.signInFallbackRedirectUrl = `/${locale}${fallbackSignInUrl}`;
  }
  if (fallbackSignUpUrl) {
    clerkProviderProps.signUpFallbackRedirectUrl = `/${locale}${fallbackSignUpUrl}`;
  }
  if (waitlistUrl) {
    clerkProviderProps.waitlistUrl = `/${locale}${waitlistUrl}`;
  }

  // console.log('ClerkProviderClient props:', clerkProviderProps);

  return (
    <ClerkProvider {...clerkProviderProps}>
      {children}
    </ClerkProvider>
  );
} 