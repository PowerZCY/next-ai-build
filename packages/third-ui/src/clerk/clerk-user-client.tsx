'use client';

import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { SignUpButtonWithFingerprint } from './signup-button-with-fingerprint-client';

interface ClerkUserData {
  signIn: string;
  signUp: string;
  terms: string;
  privacy: string;
  locale: string;
  clerkAuthInModal: boolean;
  showSignUp: boolean;
}

export function ClerkUserClient({ data }: { data: ClerkUserData }) {
  return (
    <div className="flex! items-center gap-2 h-10" data-clerk-user-area>
      <ClerkLoading>
          <div className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignInButton mode={data.clerkAuthInModal ? 'modal' : 'redirect'}>
          <button className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap">
              {data.signIn}
            </button>
          </SignInButton>
          {data.showSignUp && ( <SignUpButtonWithFingerprint mode={data.clerkAuthInModal ? 'modal' : 'redirect'} signUp={data.signUp}/> )}
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
                labelIcon={<icons.ReceiptText className="size-4 fill-none stroke-(--clerk-icon-stroke-color)" />}
                label={data.terms}
                href={`/${data.locale}/legal/terms`}>
              </UserButton.Link>}
              {<UserButton.Link
                labelIcon={<icons.ShieldUser className="size-4 fill-none stroke-(--clerk-icon-stroke-color)" />}
                label={data.privacy}
                href={`/${data.locale}/legal/privacy`}>
              </UserButton.Link>}
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}