import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { GoToTop } from '@third-ui/main';
import { Footer } from '@third-ui/main/server';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { FumaBannerSuit } from '@third-ui/fuma/server';
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

  // 在这里添加人工延迟
  // console.log('Starting 5-second delay for testing loading animation...');
  // await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒延迟
  // console.log('Delay finished. Rendering page.');
  
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
        className={`min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300 ${showBanner ? 'pt-30 has-banner' : 'pt-15 no-banner'}`}
        >
        <FumaBannerSuit locale={locale} showBanner={showBanner}/>
        {children}
        <Footer locale={locale}  />
        <GoToTop />
      </HomeLayout>
    </ClerkProviderClient>
  );
}

