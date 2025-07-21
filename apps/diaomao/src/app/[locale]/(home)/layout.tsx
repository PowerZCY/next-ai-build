import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { Footer, GoToTop } from '@third-ui/main';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { FumaBannerSuit } from '@third-ui/fuma/mdx';
import type { ReactNode } from 'react';
import { showBanner } from '@/lib/appConfig';
import { ClerkProviderClient } from '@third-ui/clerk';

async function homeOptions(locale: string): Promise<HomeLayoutProps> {
  return {
    ...(await baseOptions(locale)),
    links: [
      ...(await levelNavLinks(locale)),
      ...(await homeNavLinks(locale)),
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
        className={`dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] pt-25 ${showBanner ? 'has-banner' : 'no-banner'}`}
        >
        <FumaBannerSuit showText={showBanner}/>
        {children}
        <Footer />
        <GoToTop />
      </HomeLayout>
    </ClerkProviderClient>
  );
}

