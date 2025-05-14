/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { Waitlist } from '@clerk/nextjs';

export default function SignUpPage() {

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Waitlist />
    </div>
  );
}