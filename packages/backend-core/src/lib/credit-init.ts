// create app config
export const creditsConfig = {
  freeAmount: Number(process.env.CREDITS_INIT_FREE_AMOUNT) || 1,
  freeRegisterAmount: Number(process.env.CREDITS_INIT_FREE_REGISTER_AMOUNT) || 2,
  freeExpiredDays: Number(process.env.CREDITS_INIT_FREE_EXPIRED_DAYS) || 7,
  oneTimeExpiredDays: Number(process.env.CREDITS_ONE_TIME_EXPIRED_DAYS) || 30
};

export const { freeAmount, freeRegisterAmount, freeExpiredDays, oneTimeExpiredDays } = creditsConfig;
