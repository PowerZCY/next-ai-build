'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React from 'react';
import { zhCN } from '@clerk/localizations';
import { appConfig, showBanner } from '@/lib/appConfig';
import { Banner } from 'fumadocs-ui/components/banner';

// Use React.ComponentProps to get the props type for ClerkProvider
type ActualClerkProviderProps = React.ComponentProps<typeof ClerkProvider>;

// https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts#L492
// https://clerk.com/docs/customization/localization
export const customLocalization = {
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

const clerkVariables = { 
  colorPrimary: "#6366F1",
};

const clerkElements = {
  formButtonPrimary:
    "bg-linear-to-r from-indigo-500 to-purple-600 text-white border-none hover:opacity-90 transition-opacity",
  socialButtonsBlockButton:
    "bg-white border-gray-200 hover:bg-transparent hover:border-black text-gray-600 hover:text-black dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700",
  socialButtonsBlockButtonText: "font-semibold",
  formButtonReset:
    "bg-white border border-solid border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700",
  membersPageInviteButton:
    "bg-linear-to-r from-indigo-500 to-purple-600 text-white border-none hover:opacity-90 transition-opacity",
  // card styling is now handled by baseTheme (light/dark)
}

export function ClerkProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  // The 'appearance' object passed to ClerkProvider can have optional 'variables' and 'elements',
  // but here 'variables' and 'elements' are the props passed to ClerkProviderClient, which are defined.
  const appearance: ActualClerkProviderProps['appearance'] = {
    baseTheme: resolvedTheme === 'dark' ? dark : undefined,
    variables: clerkVariables, // This 'variables' is from props, typed as Exclude<..., undefined>
    elements: clerkElements,  // This 'elements' is from props, typed as Exclude<..., undefined>
  };

  return (
    <ClerkProvider
      localization={customLocalization}
      waitlistUrl={appConfig.clerk.waitlistUrl}
      appearance={appearance}
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