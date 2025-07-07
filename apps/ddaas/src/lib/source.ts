import { docs, legal, blog } from '.source';
import { getIconElement } from '@base-ui/components/global-icon';
import { i18n } from '@/i18n';
import { InferMetaType, InferPageType, loader } from 'fumadocs-core/source';

export const docsSource = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon: getIconElement,
});

export const blogSource = loader({
  i18n,
  baseUrl: '/blog',
  source: blog.toFumadocsSource(),
  icon: getIconElement,
});

export const legalSource = loader({
  i18n,
  baseUrl: '/legal',
  source: legal.toFumadocsSource(),
  icon: getIconElement,
});

export type Page = InferPageType<typeof docsSource>;
export type Meta = InferMetaType<typeof docsSource>;

export const mdxSourceMap = {
  docs: docsSource,
  blog: blogSource,
  legal: legalSource
}