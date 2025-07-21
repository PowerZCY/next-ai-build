import { PricePlanAppConfig } from "@third-ui/main/price-plan";

export const pricePlanConfig: PricePlanAppConfig = {
  billingOptions: [
    { key: 'monthly', discount: 0 },
    { key: 'yearly', discount: 0.20 }
  ],
  prices: {
    free: 'Free',
    premium: 10,
    ultimate: 20,
  },
  minPlanFeaturesCount: 4
}