import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { ReactNode } from 'react';
import { TocFooterWrapper } from '@third-ui/fuma/mdx';

interface FumaPageParams {  
  /* 
   * The source of the mdx content
   */
  mdxContentSource: any;
  /* 
   * The  mdx components handler, refer to fumadocs 
   */
  getMDXComponents: () => any;
  /* 
   * The source directory of the mdx content, used to generate the edit path
   */
  mdxSourceDir: string;
  /* 
   * The github base url, used to generate the edit path, if not provided, the edit path will not be shown
   */
  githubBaseUrl?: string;
  /* 
   * Whether to show the copy button, default is true
   */
  showCopy?: boolean;
  /* 
   * The site icon component to use in NotFoundPage
   */
  siteIcon: ReactNode;
  /* 
   * The fallback page component to use when the page is not found
   */
  FallbackPage: React.ComponentType<{ siteIcon: ReactNode }>; 
}

export function createFumaPage({
  mdxContentSource,
  getMDXComponents,
  mdxSourceDir,
  githubBaseUrl,
  showCopy = true,
  siteIcon,
  FallbackPage,
}: FumaPageParams) {
  const Page = async function Page({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
    const { slug, locale } = await params;
    const page = mdxContentSource.getPage(slug, locale);
    if (!page) {
      return <FallbackPage siteIcon={siteIcon} />;
    }

    const path = githubBaseUrl ? `${mdxSourceDir}/${page.file.path}` : undefined;
    const tocFooterElement = (
      <TocFooterWrapper
        lastModified={page.data.date}
        showCopy={showCopy}
        editPath={path}
        githubBaseUrl={githubBaseUrl}
      />
    );

    const MDX = page.data.body;
    return (
      <DocsPage
        tableOfContent={{ style: 'clerk', single: false, footer: tocFooterElement }}
        tableOfContentPopover={{ footer: tocFooterElement }}
        toc={page.data.toc}
        full={page.data.full}
        article={{ className: 'max-sm:pb-16' }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
        <DocsBody className="text-fd-foreground/80">
          <MDX components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  };

  function generateStaticParams() {
    return mdxContentSource.generateParams('slug', 'locale');
  }

  async function generateMetadata(props: { params: Promise<{ slug?: string[]; locale?: string }> }) {
    const params = await props.params;
    const page = mdxContentSource.getPage(params.slug, params.locale);
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

  return {
    Page,
    generateStaticParams,
    generateMetadata,
  };
} 