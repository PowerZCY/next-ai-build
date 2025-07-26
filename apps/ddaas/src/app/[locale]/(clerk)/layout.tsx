/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { baseOptions } from '@/app/[locale]/layout.config';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { FumaBannerSuit } from '@third-ui/fuma/mdx';
import { ReactNode } from 'react';
import { clerkPageBanner } from '@/lib/appConfig';
import { ClerkProviderClient } from '@third-ui/clerk';

async function homeOptions(locale: string): Promise<HomeLayoutProps>{
  const resolvedBaseOptions = await baseOptions(locale);
  return {
    ...resolvedBaseOptions,
  };
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const customeOptions = await homeOptions(locale);

  return (
    <ClerkProviderClient locale={locale}>
      <HomeLayout
        {...customeOptions}
        searchToggle={{
          enabled: false,
        }}
        themeSwitch={{
          enabled: true,
          mode: 'light-dark-system',
        }}
        className={`min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300 ${clerkPageBanner ? 'pt-30 has-banner' : 'pt-20 no-banner'}`}
        >
        <FumaBannerSuit showBanner={clerkPageBanner}/>
        {children}
      </HomeLayout>
    </ClerkProviderClient>
  );
}
