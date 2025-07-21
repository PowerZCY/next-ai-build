import { appConfig, generatedLocales } from "@/lib/appConfig";
import { fumaI18nCn } from '@third-ui/lib/server';
import { NProgressBar } from '@third-ui/main/nprogress-bar';
import { RootProvider } from "fumadocs-ui/provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Montserrat } from "next/font/google";
import './globals.css';
import React from 'react';

export const montserrat = Montserrat({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
});

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params: paramsPromise
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await paramsPromise;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('webTitle'),
    description: t('webDescription'),
    keywords: t('keywords'),
    metadataBase: new URL(appConfig.baseUrl),
    alternates: {
      canonical: `${appConfig.baseUrl}/${locale}`,
      languages: {
        "en": `${appConfig.baseUrl}/en`,
      }
    },
    icons: [
      { rel: "icon", type: 'image/png', sizes: "16x16", url: "/favicon-16x16.png" },
      { rel: "icon", type: 'image/png', sizes: "32x32", url: "/favicon-32x32.png" },
      { rel: "icon", type: 'image/ico', url: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", url: "/favicon-180x180.png" },
      { rel: "android-chrome", sizes: "512x512", url: "/favicon-512x512.png" },
    ]
  }
}

export default async function RootLayout({
  children,
  params: paramsPromise
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await paramsPromise;
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <NextIntlClientProvider messages={messages}>
        <body>
          <NProgressBar />
          <RootProvider
            i18n={{
              locale: locale,
              locales: generatedLocales,
              translations: { fumaI18nCn }[locale],
            }}
          >
            {children}
          </RootProvider>
        </body>
      </NextIntlClientProvider>
    </html>
  )
}
