'use client';

import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

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
    <div className="ms-1.5 flex items-center gap-2 h-10 me-3">
      <ClerkLoading>
          <div className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignInButton mode={data.clerkAuthInModal ? 'modal' : 'redirect'}>
            <button className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm">
              {data.signIn}
            </button>
          </SignInButton>
          {data.showSignUp && (
            <SignUpButton mode={data.clerkAuthInModal ? 'modal' : 'redirect'}>
              <button className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm">
                {data.signUp}
              </button>
            </SignUpButton>
          )}
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
                label={data.terms}
                href={`/${data.locale}/legal/terms`}>
              </UserButton.Link>}
              {<UserButton.Link
                labelIcon={<icons.ShieldUser className="size-4 fill-none stroke-[var(--clerk-icon-stroke-color)]" />}
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