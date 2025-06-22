/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { legalSource } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { NotFoundPage } from '@/components/404-page';

export default async function NotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <DocsLayout sidebar={{enabled: false}} tree={legalSource.pageTree[locale]}>
      <NotFoundPage />
    </DocsLayout>
  );
} 