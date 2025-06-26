import { blogSource } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { appConfig } from '@/lib/appConfig';
import { getMDXComponents } from '@/components/mdx-components';
import { TocFooter } from '@/components/mdx/toc';
import { NotFoundPage } from '@windrun-huaiin/base-ui';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug, locale } = await params;
  const page = blogSource.getPage(slug, locale);
  if (!page) {
    return <NotFoundPage />;
  }

  const path = `${appConfig.mdxSourceDir.blog}/${page.file.path}`;
  const tocFooterElement = <TocFooter 
    lastModified={page.data.date} 
    showCopy={true} 
    editPath={path}
    githubBaseUrl={appConfig.githubBaseUrl}
  />;
 
 
  // Markdown content requires await if you config 'async: true' in source.config.ts
  // const { body: MdxContent, toc } = await page.data.load();
  const MDX = page.data.body;
 
  return (
    <DocsPage 
      tableOfContent={{ style: 'clerk', single: false, footer: tocFooterElement}}
      tableOfContentPopover={{ footer: tocFooterElement }}
      toc={page.data.toc}
      full={page.data.full}
      article={{
        className: 'max-sm:pb-16',
      }}
      // lastUpdate={page.data.lastModified}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <DocsBody className="text-fd-foreground/80">
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
 

export function generateStaticParams() {
  return blogSource.generateParams('slug', 'locale');
}
 
export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  if (!page) {
    return {
      title: '404 - Page Not Found',
      description: 'This page could not be found.',
    };
  }
 
  return {
    title: page.data.title,
    description: page.data.description,
  };
}