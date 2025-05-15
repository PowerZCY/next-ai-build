'use client';

import React from 'react';
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { type JSX } from 'react';
import { globalLucideIcons as icons } from '@/components/global-icon';

export default function ClerkUser({ locale }: { locale: string }): JSX.Element {
  return (
    <div className="ms-1.5 flex items-center gap-2 h-10 me-3">
      <ClerkLoading>
          <div className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignInButton>
            <button className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm">
              Sign In
            </button>
          </SignInButton>
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
                labelIcon={<icons.ReceiptText className="size-4 fill-none stroke-[var(--clerk-icon-stroke-color)]" />}
                label="服务条款"
                href={`/${locale}/legal/terms`}>
              </UserButton.Link>}
              {<UserButton.Link
                labelIcon={<icons.ShieldUser className="size-4 fill-none stroke-[var(--clerk-icon-stroke-color)]" />}
                label="隐私政策"
                href={`/${locale}/legal/privacy`}>
              </UserButton.Link>}
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}