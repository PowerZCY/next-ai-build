'use client';

interface RedirectToCustomerPortalOptions {
  customerPortalApiEndpoint?: string;
  signInPath?: string;
  redirectToSignIn?: () => void;
  returnUrl?: string;
}

export async function redirectToCustomerPortal({
  customerPortalApiEndpoint,
  signInPath,
  redirectToSignIn,
  returnUrl = window.location.href,
}: RedirectToCustomerPortalOptions): Promise<boolean> {
  if (!customerPortalApiEndpoint) {
    console.error('Customer portal endpoint is not configured.');
    alert('Customer portal is temporarily unavailable.');
    return false;
  }

  try {
    const response = await fetch(customerPortalApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl,
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response from customer portal API');
      return false;
    }

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || `Request failed with status ${response.status}`;
      console.error('Customer portal request failed:', errorMessage);

      if (response.status === 401 || response.status === 403) {
        if (signInPath) {
          window.location.href = signInPath;
        } else if (redirectToSignIn) {
          redirectToSignIn();
        }
        return true;
      }

      alert(`Operation failed: ${errorMessage}`);
      return false;
    }

    if (result.success && result.data?.sessionUrl) {
      window.location.href = result.data.sessionUrl;
      return true;
    }

    console.error('Customer portal session response invalid', result);
    return false;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return false;
  }
}
