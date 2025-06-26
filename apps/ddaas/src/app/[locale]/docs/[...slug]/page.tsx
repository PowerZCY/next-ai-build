import { docsSource } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { getMDXComponents, appConfig } from '@/lib/appConfig';
import { TocFooter } from '@windrun-huaiin/third-ui/fuma';
import { NotFoundPage } from '@windrun-huaiin/base-ui';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug, locale } = await params;
  const page = docsSource.getPage(slug, locale);
  if (!page) {
    return <NotFoundPage />;
  }

  const path = `${appConfig.mdxSourceDir.docs}/${page.file.path}`;
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
      tableOfContent={{ style: 'clerk', single: false, footer: tocFooterElement }}
      tableOfContentPopover={{ footer: tocFooterElement }}
      toc={page.data.toc}
      full={page.data.full}
      article={{
        className: 'max-sm:pb-16',
      }}
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
  return docsSource.generateParams('slug', 'locale');
}
 
export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = docsSource.getPage(params.slug);
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