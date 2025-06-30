import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { NotFoundPage } from '@base-ui/components';
import { blogSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma/server';
import { SiteIcon } from '@/lib/site-config';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: blogSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.blog,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: true,
  siteIcon: <SiteIcon />,
  FallbackPage: NotFoundPage,
});

export default Page;
export { generateStaticParams, generateMetadata };