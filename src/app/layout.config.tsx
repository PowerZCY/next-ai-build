import { i18n } from '@/i18n';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appConfig } from '@/lib/appConfig';
 
export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: locale === appConfig.i18n.defaultLocale ? 'D8ger' : '帝八哥',
    },
  };
}