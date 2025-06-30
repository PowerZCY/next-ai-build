/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NotFoundPage } from '@base-ui/components/client';
import { SiteIcon } from '@/lib/site-config';

export default async function NotFound() {
  return (  
    <NotFoundPage siteIcon={<SiteIcon />} />
  );
} 