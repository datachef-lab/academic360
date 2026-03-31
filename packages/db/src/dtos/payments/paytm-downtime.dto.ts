/**
 * Paytm downtime: Fetch current downtime API + downtime notification webhook payloads.
 * Docs: https://www.paytmpayments.com/docs/api/fetch-current-downtime/
 * Webhook: https://business.paytm.com/docs/downtime-notification-callback
 */

/** Request head for checksum-based downtime APIs */
export interface PaytmDowntimeChecksumHead {
  signature: string;
  tokenType: "CHECKSUM";
  /** Required when the merchant has more than one key */
  clientId?: string;
}

/** Request body for Fetch current downtime API */
export interface PaytmFetchCurrentDowntimeBody {
  mid: string;
  /**
   * ISO-8601 window for `fetch-current-instrument-states`. Paytm’s published curl includes
   * `fromTime` / `toTime`; omitting them can yield HTTP 400.
   */
  fromTime?: string;
  toTime?: string;
  /** CC, DC, NB, UPI, WALLET — omit for all modes */
  paymentModes?: string;
}

export interface PaytmFetchCurrentDowntimeRequest {
  head: PaytmDowntimeChecksumHead;
  body: PaytmFetchCurrentDowntimeBody;
}

/** Nested instrument description (varies by payMethod / entityType) */
export type PaytmDowntimeEntity = {
  entityType?: string;
  payMode?: string;
  issuingBank?: { code?: string; name?: string };
  cardScheme?: { code?: string; name?: string };
  cardType?: { code?: string; name?: string };
  psp?: { code?: string; name?: string };
  [key: string]: unknown;
};

/** One row in `currentDowntimeStates` from Fetch current downtime API */
export interface PaytmCurrentDowntimeStateItem {
  payMethod?: string;
  entity?: PaytmDowntimeEntity;
  code?: string;
  name?: string;
  severity?: string;
  downtimeId?: string | number;
  downtimeStartTime?: string;
  /** Planned | Unplanned */
  type?: string;
  /** ACTIVE | CLOSED (when synced from webhook) */
  downtimeState?: string;
  currentDowntimeStates?: string;
  [key: string]: unknown;
}

export interface PaytmFetchCurrentDowntimeResultInfo {
  resultCode?: string;
  resultStatus?: string;
  resultMsg?: string;
}

/** Response body from Fetch current downtime API */
export interface PaytmFetchCurrentDowntimeResponseBody {
  resultInfo?: PaytmFetchCurrentDowntimeResultInfo;
  /** Paytm docs label this as string but the payload is an array of state objects */
  currentDowntimeStates?: PaytmCurrentDowntimeStateItem[] | string;
}

export interface PaytmFetchCurrentDowntimeResponse {
  head?: Record<string, unknown>;
  body?: PaytmFetchCurrentDowntimeResponseBody;
}

/** Webhook: body.currentDowntimeState (singular) */
export interface PaytmDowntimeWebhookCurrentState extends PaytmCurrentDowntimeStateItem {
  recoveryTime?: string | null;
}

export interface PaytmDowntimeWebhookBody {
  downtimeId?: string | number;
  mid?: string;
  currentDowntimeState?: PaytmDowntimeWebhookCurrentState;
}

export interface PaytmDowntimeWebhookPayload {
  head?: {
    tokenType?: string;
    clientId?: string;
    signature?: string | null;
  };
  body?: PaytmDowntimeWebhookBody;
}

/** Env-backed defaults for downtime polling (backend may override via env) */
export interface PaymentVendorDowntimeConfig {
  vendor: "paytm";
  pollIntervalMinutes: number;
  fetchCurrentDowntimeUrl: string;
}

export function createDefaultPaytmDowntimeConfig(): PaymentVendorDowntimeConfig {
  return {
    vendor: "paytm",
    pollIntervalMinutes: 10,
    fetchCurrentDowntimeUrl:
      "https://secure.paytmpayments.com/downtime-manager/api/paytm/pg/daas/fetch-current-instrument-states",
  };
}

/** Normalized row for persistence (maps to `payment_vendor_downtime` + entities) */
export type PaymentVendorDowntimeNormalizedRow = {
  vendor: string;
  type: string | null;
  currentDowntimeStates: string | null;
  payMethod: string | null;
  severity: string | null;
  vendorDowntimeId: string | null;
  downtimeStartTime: string | null;
  entities: Array<{ type: string; code: string; name: string }>;
};
