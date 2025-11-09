
import { appConfig } from '@/lib/appConfig';
import { moneyPriceConfig } from '@/lib/money-price-config';
import { getMoneyPriceInitUserContext } from '@/lib/money-price-helper';
import { FingerprintStatus } from "@third-ui/clerk/fingerprint";
import { MoneyPrice } from "@third-ui/main/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const isDev = process.env.NODE_ENV !== 'production';
  const forceShow = process.env.SHOW_FINGERPRINT_STATUS === 'true'
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';
  const { locale } = await params;
  const initUserContext = await getMoneyPriceInitUserContext();
  return (
    <>
      { (forceShow || isDev) && <FingerprintStatus />}
      <MoneyPrice
        locale={locale}
        config={moneyPriceConfig}
        checkoutApiEndpoint="/api/stripe/checkout"
        customerPortalApiEndpoint="/api/stripe/customer-portal"
        enableClerkModal={appConfig.style.clerkAuthInModal}
        enabledBillingTypes={['monthly', 'yearly', 'onetime']}
        enableSubscriptionUpgrade={enableSubscriptionUpgrade}
        initUserContext={initUserContext}
      />
    </>
  );
}
