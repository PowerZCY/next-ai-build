import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { blogSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: blogSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.blog,
});

export default Page;
export { generateStaticParams, generateMetadata };