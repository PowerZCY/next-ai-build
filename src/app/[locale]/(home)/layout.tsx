import type { ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { Footer } from '@/components/footer';
import { RootProvider } from 'fumadocs-ui/provider';
import { generatedLocales } from '@/lib/appConfig';
import { Banner } from 'fumadocs-ui/components/banner';
import { cn } from '@/lib/fuma-search-util';

async function homeOptions(locale: string): Promise<HomeLayoutProps> {
  const options = await baseOptions(locale);
  return {
    ...options,
    links: [
      ...levelNavLinks(locale),
      ...homeNavLinks(locale),
      ]
  };
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const customeOptions = await homeOptions(locale);

  // 在这里添加人工延迟
  // console.log('Starting 5-second delay for testing loading animation...');
  // await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒延迟
  // console.log('Delay finished. Rendering page.');

  return (
    <RootProvider
      i18n={{
        locale: locale,
        // available languages
        locales: generatedLocales,
        // translations for UI
        translations: { cn }[locale],
      }}
      search={{
        enabled: true,
      }}
    >
      <Banner variant="rainbow" id="Re8ger" changeLayout={false}>
          <p className="text-xl">A modern, responsive, and accessible documentation theme for Fumadocs.</p>
      </Banner>
      <HomeLayout
        {...customeOptions}
        searchToggle={{
          enabled: false,
        }}
        className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)]"
      >
        {children}
        <Footer />
      </HomeLayout>
    </RootProvider>
  );
}

