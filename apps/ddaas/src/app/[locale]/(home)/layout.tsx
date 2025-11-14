import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';
import { showBanner } from '@/lib/appConfig';
import { ClerkProviderClient } from '@third-ui/clerk';
import { FingerprintProvider } from '@third-ui/clerk/fingerprint';
import { fingerprintConfig } from '@/lib/fingerprint-config';
import { CustomHomeLayout } from '@third-ui/fuma/base';

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
  
  const homeLayoutOptions: HomeLayoutProps = {
    ...customeOptions,
    searchToggle: {
      enabled: false,
    },
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
  };

  return (
    <ClerkProviderClient locale={locale}>
      <FingerprintProvider config={fingerprintConfig}>
        <CustomHomeLayout
          locale={locale}
          options={homeLayoutOptions}
          showBanner={showBanner}
          floatingNav={false}
        >
          {children}
        </CustomHomeLayout>
        </FingerprintProvider>
    </ClerkProviderClient>
  );
}
