'use client';

import { cn } from '@lib/utils';
import type { HTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';

export type SiteXProps = Omit<HTMLAttributes<HTMLSpanElement>, 'type'> & {
  type: 'site' | 'email';
  namespace?: string;
  tKey?: string;
};

export function SiteX({ type, namespace, tKey, className, ...props }: SiteXProps) {
  // 默认命名空间和key
  let ns = namespace;
  let key = tKey;
  if (!ns) {
    ns = type === 'site' ? 'home' : 'footer';
  }
  if (!key) {
    key = type === 'site' ? 'title' : 'email';
  }
  const t = useTranslations(ns);
  const text = t(key, { defaultValue: type === 'site' ? 'Site----' : '----@example.com' });

  if (type === 'site') {
    return (
      <strong
        {...props}
        className={cn(
          'font-extrabold text-sm',
          className
        )}
      >
        {text}
      </strong>
    );
  }
  if (type === 'email') {
    return (
      <a
        {...props}
        href={`mailto:${text}`}
        className={cn(
          'font-mono underline text-sm',
          className
        )}
      >
        {text}
      </a>
    );
  }
  return null;
} 