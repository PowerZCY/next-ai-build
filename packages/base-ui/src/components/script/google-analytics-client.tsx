/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Script from "next/script";

interface GoogleAnalyticsClientProps {
  analyticsId: string;
}

export function GoogleAnalyticsClient({ analyticsId }: GoogleAnalyticsClientProps) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsId}');
          `,
        }}
      />
    </>
  );
}

export function useGoogleAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    if (typeof window === "undefined" || !window.gtag) {
      return;
    }

    window.gtag("event", event, data);
  };

  return {
    trackEvent,
  };
}

// Add gtag type definition to window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}