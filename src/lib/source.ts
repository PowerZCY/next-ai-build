import { createMDXSource } from 'fumadocs-mdx';
import { docs, blog as blogPosts } from '.source';
import { i18n } from '@/i18n';
import { InferMetaType, InferPageType, loader } from 'fumadocs-core/source';
import { Bitcoin, Bug, icons } from 'lucide-react';
import { createElement } from 'react';
 
export const docsSource = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // 这里是解析mdx文件头中的icon, 但是也要依赖mdx-components.tsx中的图标先导入资源
  icon(icon) {
    if (!icon) {
      // You may set a default icon
      return createElement(Bitcoin);
    }
 
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
    return createElement(Bug)
  },
});

export const blogSource = loader({
  i18n,
  baseUrl: '/blog',
  source: createMDXSource(blogPosts),   
});

export type Page = InferPageType<typeof docsSource>;
export type Meta = InferMetaType<typeof docsSource>;