import { GoogleAnalyticsClient } from '@base-ui/components/script';

export function GoogleAnalyticsScript() {
  // Only load in production environment
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Get and validate Google Analytics ID
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  
  if (!googleAnalyticsId) {
    console.warn('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID is not configured');
    return null;
  }

  return <GoogleAnalyticsClient analyticsId={googleAnalyticsId} />;
}

// Re-export the hook for convenience
export { useGoogleAnalytics } from './google-analytics-client';
