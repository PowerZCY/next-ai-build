/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SignIn, SignUp, Waitlist } from '@clerk/nextjs';

// Legacy page generators (for backward compatibility)
export function createSignInPage() {
  return function SignInPage() {
    return (
      <div className="flex-1 flex justify-center mb-64">
        <SignIn />
      </div>
    );
  };
}

export function createSignUpPage() {
  return function SignUpPage() {
    return (
      <div className="flex-1 flex justify-center mt-0 mb-32">
        <SignUp />
      </div>
    );
  };
}

export function createWaitlistPage() {
  return function WaitlistPage() {
    return (
      <div className="flex-1 flex justify-center mt-10">
        <Waitlist />
      </div>
    );
  };
}

// Note: Fingerprint-aware page generators moved to client-side only
// Use the fingerprint components directly in your client-side code 