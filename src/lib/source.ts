import { createMDXSource } from 'fumadocs-mdx';
import { docs, blog as blogPosts, legal } from '.source';
import { i18n } from '@/i18n';
import { InferMetaType, InferPageType, loader } from 'fumadocs-core/source';
import { createElement } from 'react';
import { globalLucideIcons as icons } from '@/components/global-icon';

// 新提取的函数
function getIconElement(icon: string | undefined, defaultIconKey: keyof typeof icons = 'BTC') {
  if (icon) {
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
    // 如果 frontmatter 中指定的图标无效，则使用 defaultIconKey 对应的图标
    return createElement(icons[defaultIconKey]);
  }
  return undefined;
}

export const docsSource = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon: getIconElement, // 使用新函数
});

export const blogSource = loader({
  i18n,
  baseUrl: '/blog',
  source: createMDXSource(blogPosts),
});

export const legalSource = loader({
  i18n,
  baseUrl: '/legal',
  source: legal.toFumadocsSource(),
  icon: getIconElement, // 使用新函数
});

export type Page = InferPageType<typeof docsSource>;
export type Meta = InferMetaType<typeof docsSource>;