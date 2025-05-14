'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { type JSX } from 'react';
import { globalLucideIcons as icons } from '@/components/global-icon';

export default function ClerkUser({ locale }: { locale: string }): JSX.Element {
  return (
    <div className="ms-1.5 flex items-center gap-2 h-10 me-3">
      <SignedOut>
        <SignInButton>
          <button className="w-20 h-9 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center">
            SIGNIN
          </button>
        </SignInButton>
        <SignUpButton>
          <button className="w-20 h-9 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center">
            SIGNUP
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 border",
            }
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Action label="manageAccount" />
            {<UserButton.Link
              labelIcon={<icons.ReceiptText width={16} height={16} fill='none' stroke='var(--clerk-icon-stroke-color)' />}
              label="服务条款"
              href={`/${locale}/legal/terms`}>
            </UserButton.Link>}
            {<UserButton.Link
              labelIcon={<icons.ShieldUser width={16} height={16} fill='none' stroke='var(--clerk-icon-stroke-color)' />}
              label="隐私政策"
              href={`/${locale}/legal/privacy`}>
            </UserButton.Link>}
            <UserButton.Action label="signOut" />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  );
}