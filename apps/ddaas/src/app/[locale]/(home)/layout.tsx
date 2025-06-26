import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { Footer } from '@windrun-huaiin/third-ui/main';
import GoToTop from '@windrun-huaiin/third-ui/main';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { FumaBannerSuit } from '@windrun-huaiin/third-ui/fuma';
import type { ReactNode } from 'react';
import { showBanner } from '@/lib/appConfig';
import { ClerkProviderClient } from '@windrun-huaiin/third-ui/clerk';

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

