import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { Footer } from '@/components/footer';
import GoToTop from '@/components/go-to-top';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';

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
    <HomeLayout
      {...customeOptions}
      searchToggle={{
        enabled: false,
      }}
      className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] pt-25"
    >
      {children}
      <Footer />
      <GoToTop />
    </HomeLayout>
  );
}

