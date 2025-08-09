import { MicrosoftClarityClient } from './microsoft-clarity-client';

export function MicrosoftClarityScript() {
  // Only load in production environment
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Get and validate Microsoft Clarity ID
  const microsoftClarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;
  
  if (!microsoftClarityId) {
    console.warn('NEXT_PUBLIC_MICROSOFT_CLARITY_ID is not configured');
    return null;
  }

  return <MicrosoftClarityClient clarityId={microsoftClarityId} />;
} 