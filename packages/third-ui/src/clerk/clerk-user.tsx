'use client';

import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTranslations } from 'next-intl';
import { type JSX } from 'react';

interface ClerkUserProps {
  locale: string;
  // default as true, ‘cause Clerk direct is not well, so just use model for sign-in/sign-up
  clerkAuthInModal?: boolean;
  showSignUp?: boolean;
}

export function ClerkUser({ 
  locale, 
  clerkAuthInModal = true,
  showSignUp = true
}: ClerkUserProps): JSX.Element {
  const t = useTranslations('clerk');
  const t2 = useTranslations('footer');
  return (
    <div className="ms-1.5 flex items-center gap-2 h-10 me-3">
      <ClerkLoading>
          <div className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignInButton mode={clerkAuthInModal ? 'modal' : 'redirect'}>
            <button className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm">
              {t('signIn')}
            </button>
          </SignInButton>
          {showSignUp && (
            <SignUpButton mode={clerkAuthInModal ? 'modal' : 'redirect'}>
              <button className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm">
                {t('signUp')}
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
                label={t2('terms')}
                href={`/${locale}/legal/terms`}>
              </UserButton.Link>}
              {<UserButton.Link
                labelIcon={<icons.ShieldUser className="size-4 fill-none stroke-[var(--clerk-icon-stroke-color)]" />}
                label={t2('privacy')}
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