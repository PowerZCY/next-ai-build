/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { baseOptions } from '@/app/[locale]/layout.config';
import { Footer } from "@/components/footer";
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { RootProvider } from 'fumadocs-ui/provider';
import { ReactNode } from 'react';
import { ClerkProviderClient } from '@/components/ClerkProviderClient';
import { generatedLocales } from '@/lib/appConfig';
import { cn } from '@/lib/fuma-search-util';
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
    
    <RootProvider
      i18n={{
        locale: locale,
        // available languages
        locales: generatedLocales,
        // translations for UI
        translations: { cn }[locale],
      }}
    > 
      <ClerkProviderClient>
        <HomeLayout
          {...customeOptions}
          searchToggle={{
            enabled: false,
          }}
        className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] pt-25"
        >
          {children}
          <Footer />
        </HomeLayout>
      </ClerkProviderClient>
    </RootProvider>
  );
}
