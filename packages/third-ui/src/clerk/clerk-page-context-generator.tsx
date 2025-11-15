'use client';

/**
 * Client-side page generators with fingerprint support
 * These should only be used in client-side code
 */

import { SignUpWithFingerprint } from './signup-with-fingerprint-client';
import { SignInWithFingerprint } from './signin-with-fingerprint-client';

/**
 * Create a SignUp page with fingerprint support
 * Note: This must be used within a FingerprintProvider
 */
export function createSignUpPageWithFingerprint() {
  return function SignUpPage() {
    return (
      <div className="flex-1 flex justify-center m-32">
        <SignUpWithFingerprint />
      </div>
    );
  };
}

/**
 * Create a SignIn page with fingerprint support
 * Note: This must be used within a FingerprintProvider
 */
export function createSignInPageWithFingerprint() {
  return function SignInPage() {
    return (
      <div className="flex-1 flex justify-center m-32">
        <SignInWithFingerprint />
      </div>
    );
  };
}