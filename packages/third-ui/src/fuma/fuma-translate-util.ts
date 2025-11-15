import { getTranslations } from 'next-intl/server';
import { Translations } from 'fumadocs-ui/i18n';

const defaultFumaTranslations: Translations = {
  search: 'Search',
  searchNoResult: 'No results found',
  toc: 'On this page',
  tocNoHeadings: 'No Headings',
  lastUpdate: 'Last updated on',
  chooseLanguage: 'Choose a language',
  nextPage: 'Next Page',
  previousPage: 'Previous Page',
  chooseTheme: 'Theme',
  editOnGithub: 'Edit on GitHub',
};

type FumaTranslationKey = keyof Translations;

function resolveTranslation(
  t: Awaited<ReturnType<typeof getTranslations>>,
  key: FumaTranslationKey,
) {
  const value = t.raw(key);
  return typeof value === 'string' ? value : defaultFumaTranslations[key];
}

export async function getFumaTranslations(
  locale: string,
): Promise<Partial<Translations>> {
  const t = await getTranslations({ locale, namespace: 'fuma' });

  return {
    search: resolveTranslation(t, 'search'),
    searchNoResult: resolveTranslation(t, 'searchNoResult'),
    toc: resolveTranslation(t, 'toc'),
    tocNoHeadings: resolveTranslation(t, 'tocNoHeadings'),
    lastUpdate: resolveTranslation(t, 'lastUpdate'),
    chooseLanguage: resolveTranslation(t, 'chooseLanguage'),
    nextPage: resolveTranslation(t, 'nextPage'),
    previousPage: resolveTranslation(t, 'previousPage'),
    chooseTheme: resolveTranslation(t, 'chooseTheme'),
    editOnGithub: resolveTranslation(t, 'editOnGithub'),
  } satisfies Partial<Translations>;
}
