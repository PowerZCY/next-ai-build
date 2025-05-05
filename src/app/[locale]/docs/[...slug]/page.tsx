import { docsSource } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/lib/mdx-components';
import { EditOnGitHub, LLMCopyButton } from './page.client';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug, locale } = await params;
  const page = docsSource.getPage(slug, locale);
  if (!page) notFound();

  const path = `src/app/mdx/${page.file.path}`;
	const tocFooter = (
    <div className="flex flex-col gap-y-2 items-start m-4">
      <LLMCopyButton />
      <EditOnGitHub
        url={`https://github.com/caofanCPU/next-ai-build/blob/fumadocs-base/${path}`}
      />
    </div>
	);
 
  const MDX = page.data.body;
 
  return (
    <DocsPage 
      tableOfContent={{ style: 'clerk', single: false, footer: tocFooter }}
      tableOfContentPopover={{ footer: tocFooter }}
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
  if (!page) notFound();
 
  return {
    title: page.data.title,
    description: page.data.description,
  };
}