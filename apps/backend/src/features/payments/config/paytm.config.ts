/**
 * Paytm Payment Gateway configuration.
 * Get credentials from: https://dashboard.paytm.com/next/apikeys
 */

const STAGING = "STAGING";
const PRODUCTION = "PRODUCTION";

export const paytmConfig = {
  mid: process.env.PAYTM_MID ?? "",
  merchantKey: process.env.PAYTM_MERCHANT_KEY ?? "",
  website: process.env.PAYTM_WEBSITE ?? "",
  clientId: process.env.PAYTM_CLIENT_ID ?? "",
  callbackUrl: process.env.PAYTM_CALLBACK_URL ?? "",
  environment:
    process.env.PAYTM_ENVIRONMENT === PRODUCTION ? PRODUCTION : STAGING,
} as const;

export function isPaytmConfigured(): boolean {
  return !!(
    paytmConfig.mid &&
    paytmConfig.merchantKey &&
    paytmConfig.website &&
    paytmConfig.callbackUrl
  );
}

/** Client ID is optional; use MID as fallback when not provided */
export function getPaytmClientId(): string {
  return paytmConfig.clientId || paytmConfig.mid;
}
