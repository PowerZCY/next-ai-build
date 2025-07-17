import type { ReactNode } from 'react';
import { legalSource } from '@/lib/source-legal';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
 
  return (
    <DocsLayout sidebar={{enabled: false}} tree={legalSource.pageTree[locale]}>
      {children}
    </DocsLayout>
  );
}