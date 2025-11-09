
import { Hero } from "@/components/hero";
import { FingerprintStatus } from "@third-ui/clerk/fingerprint";
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button";
import { CTA, FAQ, Features, Gallery, SeoContent, Tips, Usage } from "@third-ui/main/server";
import { getTranslations } from "next-intl/server";
import { appConfig } from '@/lib/appConfig';
import { moneyPriceConfig } from '@/lib/money-price-config';
import { getMoneyPriceInitUserContext } from '@/lib/money-price-helper';
import { MoneyPrice } from "@third-ui/main/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const isDev = process.env.NODE_ENV !== 'production';
  const forceShow = process.env.SHOW_FINGERPRINT_STATUS === 'true'
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });

  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';
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
      <Hero locale={locale}/>
      <Gallery
        locale={locale}
        button={
          <GradientButton
            title={t("button.title")}
            href={t("button.href")}
            align={t("button.align") as "center" | "left" | "right"}
          />
        }
      />
      <Usage locale={locale} />
      <Features locale={locale} />
      <Tips locale={locale} />
      <FAQ locale={locale} />
      <SeoContent locale={locale} />
      <CTA locale={locale} />
    </>
  );
}
