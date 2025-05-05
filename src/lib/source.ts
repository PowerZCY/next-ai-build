import { createMDXSource } from 'fumadocs-mdx';
import { docs, blog as blogPosts } from '.source';
import { i18n } from '@/i18n';
import { InferMetaType, InferPageType, loader } from 'fumadocs-core/source';
import { createElement } from 'react';
import { globalLucideIcons as icons } from '@/lib/mdx-components';

export const docsSource = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // 这里是解析mdx文件头中的icon, 但是也要依赖mdx-components.tsx中的图标先导入资源
  icon(icon) {
    if (icon) {
      // 如果图标在icons中，则返回该图标
      if (icon in icons) {
        return createElement(icons[icon as keyof typeof icons]);
      }
      // 如果图标不在icons中，则返回默认图标
      return createElement(icons.Bitcoin);
    }
    // 如果图标为空，则为空
  },
});

export const blogSource = loader({
  i18n,
  baseUrl: '/blog',
  source: createMDXSource(blogPosts),   
});

export type Page = InferPageType<typeof docsSource>;
export type Meta = InferMetaType<typeof docsSource>;