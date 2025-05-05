import type { ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { Footer } from '@/components/footer';
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

  return (
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
  );
}

