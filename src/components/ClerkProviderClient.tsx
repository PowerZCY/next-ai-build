'use client';

import { appConfig } from '@/lib/appConfig';
import { clerkIntl } from '@/lib/clerk-intl';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

export function ClerkProviderClient({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {

  const signInUrlWithLocale = `/${locale}${appConfig.clerk.signInUrl}`;
  const signUpUrlWithLocale = `/${locale}${appConfig.clerk.signUpUrl}`;
  const signInFallbackRedirectUrlWithLocale = `/${locale}${appConfig.clerk.fallbackSignInUrl}`;
  const signUpFallbackRedirectUrlWithLocale = `/${locale}${appConfig.clerk.fallbackSignUpUrl}`;
  const waitlistUrlWithLocale = `/${locale}${appConfig.clerk.waitlistUrl}`;
  const currentLocalization = clerkIntl[locale as keyof typeof clerkIntl];

  console.log(`ClerkProviderClient - signInUrl for ClerkProvider: ${signInUrlWithLocale}`);

  return (
    <ClerkProvider
      signInUrl={signInUrlWithLocale}
      signUpUrl={signUpUrlWithLocale}
      signInFallbackRedirectUrl={signInFallbackRedirectUrlWithLocale}
      signUpFallbackRedirectUrl={signUpFallbackRedirectUrlWithLocale}
      waitlistUrl={waitlistUrlWithLocale}
      localization={currentLocalization}
    >
      {children}
    </ClerkProvider>
  );
} 