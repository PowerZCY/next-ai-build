import { ClerkProvider } from '@clerk/nextjs';
import { dark, shadesOfPurple } from '@clerk/themes';
import React from 'react';
import { zhCN, enUS } from '@clerk/localizations';
import { appConfig, showBanner } from '@/lib/appConfig';
import { Banner } from 'fumadocs-ui/components/banner';

// https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts#L492
// https://clerk.com/docs/customization/localization
const customZH = {
  // Use the default zhCN localization
  ...zhCN,
  // Override specific fields here
  formFieldInputPlaceholder__emailAddress: '请输入邮箱地址',
  formFieldInputPlaceholder__emailAddress_username: '请输入邮箱或用户名',
  signIn: {
    start: {
      actionLink__join_waitlist: '加入候选列表',
      actionText__join_waitlist: '想要提前接入？',
      subtitle: '欢迎回来！请登录',
      title: '登录·{{applicationName}}·',
    }
  },
  waitlist: {
    start: {
      actionLink: '登录',
      actionText: '已经注册？',
      formButton: '加入候选列表',
      subtitle: '输入你的邮箱地址，我们会尽快通知你',
      title: '加入候选列表',
    },
    success: {
      message: '你将被重定向...',
      subtitle: '我们会尽快通知你',
      title: '感谢加入候选列表！',
    },
  }
};

const clerkIntl = {
  en: enUS,
  zh: customZH,
}

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
      appearance={{
        signIn: { baseTheme: shadesOfPurple },
        signUp: { baseTheme: dark },
      }}
    >
      {showBanner ? 
        (<Banner variant="rainbow" changeLayout={false}>
          <p className="text-xl">A modern, responsive, and accessible documentation theme for Fumadocs.</p>
        </Banner>)
        : (<></>)
      }
      {children}
    </ClerkProvider>
  );
} 