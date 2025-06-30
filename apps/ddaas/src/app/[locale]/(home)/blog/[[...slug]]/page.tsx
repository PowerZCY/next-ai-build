import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { SiteIcon } from '@/lib/site-config';
import { blogSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma/server';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: blogSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.blog,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: true,
  siteIcon: <SiteIcon />,
});

export default Page;
export { generateStaticParams, generateMetadata };