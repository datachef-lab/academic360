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
  /** HMAC secret from Paytm settlement onboarding (not the PG checksum key). Used for JWT on settlement APIs. */
  settlementClientSecret: process.env.PAYTM_SETTLEMENT_CLIENT_SECRET ?? "",
  /** `email` claim for settlement JWT (see settlement API auth docs). */
  settlementJwtEmail:
    process.env.PAYTM_SETTLEMENT_JWT_EMAIL ?? "settlement@merchant.local",
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

/** Settlement APIs use the onboarding `clientId` header; optional override via env. */
export function getPaytmSettlementClientId(): string {
  const fromEnv = process.env.PAYTM_SETTLEMENT_CLIENT_ID?.trim();
  return fromEnv || paytmConfig.clientId || paytmConfig.mid;
}

/** Settlement Order Detail and related APIs need MID + settlement client secret + client id for JWT. */
export function isPaytmSettlementConfigured(): boolean {
  return !!(
    paytmConfig.mid &&
    paytmConfig.settlementClientSecret &&
    getPaytmSettlementClientId()
  );
}
