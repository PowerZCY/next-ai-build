import { docsSource } from '@/lib/source';
import { createI18nSearchAPI } from 'fumadocs-core/search/server';
import { i18n } from '@/i18n';
 
export const { GET } = createI18nSearchAPI('advanced', {
  i18n,
  indexes: docsSource.getLanguages().flatMap(({ language, pages }) =>
    pages
      .filter(page => typeof page.data.title === 'string' && page.data.title.length > 0)
      .map((page) => ({
        locale: language,
        title: page.data.title as string,
        description: page.data.description,
        url: page.url,
        keywords: page.data.keywords,
        structuredData: page.data.structuredData,
        id: page.url,
      })),
  ),
});