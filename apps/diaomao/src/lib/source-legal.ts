import { legal } from '.source';
import { i18n } from '@/i18n';
import { getIconElement } from '@base-ui/components/global-icon';
import { loader } from 'fumadocs-core/source';

export const legalSource = loader({
  i18n,
  baseUrl: '/legal',
  source: legal.toFumadocsSource(),
  icon: getIconElement,
});