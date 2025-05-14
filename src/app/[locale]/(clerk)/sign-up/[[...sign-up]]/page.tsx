/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1 flex justify-center p-4">
        <SignUp />
      </div>
    </main>
  );
}