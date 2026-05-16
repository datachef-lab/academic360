import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  paymentVendorDowntimeEntityModel,
  paymentVendorDowntimeModel,
} from "@repo/db/schemas/models/payments";
import type {
  PaytmCurrentDowntimeStateItem,
  PaytmDowntimeEntity,
  PaytmDowntimeWebhookPayload,
  PaymentVendorDowntimeNormalizedRow,
} from "@repo/db/dtos/payments";

const VENDOR_PAYTM = "paytm";

/** Pay methods that represent “online” PG usage for coarse availability */
const CORE_ONLINE_PAY_METHODS = new Set(
  [
    "UPI",
    "CARD_PAYMENT",
    "NET_BANKING",
    "NETBANKING",
    "BALANCE",
    "PAYTM WALLET",
    "PAYTM_WALLET",
    "WALLET",
  ].map((s) => s.toUpperCase()),
);

function normalizePayMethod(raw: string | undefined | null): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "_");
}

function isCoreOnlinePayMethod(payMethod: string | null | undefined): boolean {
  const n = normalizePayMethod(payMethod);
  if (!n) return false;
  if (CORE_ONLINE_PAY_METHODS.has(n)) return true;
  if (n.includes("CARD")) return true;
  if (n.includes("UPI")) return true;
  if (n.includes("NET") && n.includes("BANK")) return true;
  return false;
}

function normalizeSeverity(raw: string | undefined | null): string {
  return (raw ?? "").trim().toUpperCase();
}

function isSevereSeverity(severity: string): boolean {
  const s = normalizeSeverity(severity);
  return s === "SEVERE";
}

function isModerateOrFluctuation(severity: string): boolean {
  const s = normalizeSeverity(severity);
  return (
    s === "MODERATE" ||
    s === "FLUCTUATION" ||
    s === "FLUCTUATING" ||
    s.includes("FLUCT")
  );
}

export function flattenPaytmDowntimeEntity(
  entity: PaytmDowntimeEntity | Record<string, unknown> | undefined | null,
): Array<{ type: string; code: string; name: string }> {
  if (!entity || typeof entity !== "object") return [];
  const e = entity as Record<string, unknown>;
  const rows: Array<{ type: string; code: string; name: string }> = [];

  if (e.entityType != null) {
    const et = String(e.entityType);
    rows.push({ type: "entityType", code: et, name: et });
  }

  for (const key of ["issuingBank", "cardScheme", "cardType", "psp"] as const) {
    const v = e[key];
    if (
      v &&
      typeof v === "object" &&
      v !== null &&
      "code" in v &&
      "name" in v
    ) {
      const o = v as { code: string; name: string };
      rows.push({
        type: key,
        code: String(o.code ?? ""),
        name: String(o.name ?? ""),
      });
    }
  }

  return rows;
}

function normalizeFromStateItem(
  item: PaytmCurrentDowntimeStateItem,
): PaymentVendorDowntimeNormalizedRow {
  const downtimeId = item.downtimeId;
  const vendorDowntimeId =
    downtimeId === undefined || downtimeId === null ? null : String(downtimeId);

  const downtimeState =
    typeof item.downtimeState === "string" ? item.downtimeState : "ACTIVE";

  const typeField =
    typeof item.type === "string"
      ? item.type
      : ((item as { "Downtime Types"?: string })["Downtime Types"] ?? null);

  return {
    vendor: VENDOR_PAYTM,
    type: typeField,
    currentDowntimeStates: downtimeState,
    payMethod: item.payMethod ?? null,
    severity: item.severity ?? null,
    vendorDowntimeId,
    downtimeStartTime: item.downtimeStartTime ?? null,
    entities: flattenPaytmDowntimeEntity(item.entity),
  };
}

async function insertDowntimeRow(
  row: PaymentVendorDowntimeNormalizedRow,
): Promise<void> {
  const [inserted] = await db
    .insert(paymentVendorDowntimeModel)
    .values({
      vendor: row.vendor,
      type: row.type ?? undefined,
      currentDowntimeStates: row.currentDowntimeStates ?? undefined,
      payMethod: row.payMethod ?? undefined,
      severity: row.severity ?? undefined,
      vendorDowntimeId: row.vendorDowntimeId ?? undefined,
      downtimeStartTime: row.downtimeStartTime ?? undefined,
    })
    .returning({ id: paymentVendorDowntimeModel.id });

  const parentId = inserted?.id;
  if (!parentId || row.entities.length === 0) return;

  await db.insert(paymentVendorDowntimeEntityModel).values(
    row.entities.map((e) => ({
      paymentVendorDowntimeId: parentId,
      name: e.name,
      type: e.type,
      code: e.code,
    })),
  );
}

/**
 * Replace all Paytm rows with the latest snapshot from Fetch current downtime (cron).
 */
export async function syncPaytmDowntimeFromFetch(
  states: PaytmCurrentDowntimeStateItem[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: paymentVendorDowntimeModel.id })
      .from(paymentVendorDowntimeModel)
      .where(eq(paymentVendorDowntimeModel.vendor, VENDOR_PAYTM));

    const ids = existing.map((r) => r.id);
    if (ids.length > 0) {
      await tx
        .delete(paymentVendorDowntimeEntityModel)
        .where(
          inArray(
            paymentVendorDowntimeEntityModel.paymentVendorDowntimeId,
            ids,
          ),
        );
      await tx
        .delete(paymentVendorDowntimeModel)
        .where(eq(paymentVendorDowntimeModel.vendor, VENDOR_PAYTM));
    }

    for (const item of states) {
      const row = normalizeFromStateItem(item);
      const [inserted] = await tx
        .insert(paymentVendorDowntimeModel)
        .values({
          vendor: row.vendor,
          type: row.type ?? undefined,
          currentDowntimeStates: row.currentDowntimeStates ?? undefined,
          payMethod: row.payMethod ?? undefined,
          severity: row.severity ?? undefined,
          vendorDowntimeId: row.vendorDowntimeId ?? undefined,
          downtimeStartTime: row.downtimeStartTime ?? undefined,
        })
        .returning({ id: paymentVendorDowntimeModel.id });

      const parentId = inserted?.id;
      if (!parentId || row.entities.length === 0) continue;

      await tx.insert(paymentVendorDowntimeEntityModel).values(
        row.entities.map((e) => ({
          paymentVendorDowntimeId: parentId,
          name: e.name,
          type: e.type,
          code: e.code,
        })),
      );
    }
  });
}

function webhookBodyToState(
  payload: PaytmDowntimeWebhookPayload,
): PaytmCurrentDowntimeStateItem | null {
  const b = payload.body;
  if (!b) return null;
  const inner = b.currentDowntimeState;
  if (!inner) return null;

  const severity =
    inner.severity ?? (b as { severity?: string }).severity ?? undefined;

  return {
    ...inner,
    severity,
    downtimeId: inner.downtimeId ?? b.downtimeId,
    downtimeStartTime: inner.downtimeStartTime,
    downtimeState: inner.downtimeState,
  };
}

/**
 * Upsert a single downtime row from Paytm downtime notification webhook.
 */
export async function syncPaytmDowntimeFromWebhook(
  payload: PaytmDowntimeWebhookPayload,
): Promise<void> {
  const state = webhookBodyToState(payload);
  if (!state) return;

  const row = normalizeFromStateItem(state);
  if (!row.vendorDowntimeId) {
    await insertDowntimeRow(row);
    return;
  }

  const existing = await db
    .select({ id: paymentVendorDowntimeModel.id })
    .from(paymentVendorDowntimeModel)
    .where(
      and(
        eq(paymentVendorDowntimeModel.vendor, VENDOR_PAYTM),
        eq(paymentVendorDowntimeModel.vendorDowntimeId, row.vendorDowntimeId),
      ),
    )
    .limit(1);

  const id = existing[0]?.id;
  if (!id) {
    await insertDowntimeRow(row);
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(paymentVendorDowntimeEntityModel)
      .where(eq(paymentVendorDowntimeEntityModel.paymentVendorDowntimeId, id));

    await tx
      .update(paymentVendorDowntimeModel)
      .set({
        type: row.type ?? undefined,
        currentDowntimeStates: row.currentDowntimeStates ?? undefined,
        payMethod: row.payMethod ?? undefined,
        severity: row.severity ?? undefined,
        downtimeStartTime: row.downtimeStartTime ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(paymentVendorDowntimeModel.id, id));

    if (row.entities.length > 0) {
      await tx.insert(paymentVendorDowntimeEntityModel).values(
        row.entities.map((e) => ({
          paymentVendorDowntimeId: id,
          name: e.name,
          type: e.type,
          code: e.code,
        })),
      );
    }
  });
}

export interface OnlinePaymentAvailabilityResult {
  vendor: string;
  /** False when any *active* core online instrument has SEVERE downtime */
  available: boolean;
  /** True when there is active moderate/fluctuation (but not severe blocking) */
  degraded: boolean;
  activeDowntimeCount: number;
  blockingDowntimes: Array<{
    vendorDowntimeId: string | null;
    payMethod: string | null;
    severity: string | null;
    type: string | null;
  }>;
}

/**
 * Read stored Paytm downtime rows and derive coarse online availability for the cashier.
 */
export async function getOnlinePaymentAvailability(): Promise<OnlinePaymentAvailabilityResult> {
  const rows = await db
    .select({
      vendorDowntimeId: paymentVendorDowntimeModel.vendorDowntimeId,
      payMethod: paymentVendorDowntimeModel.payMethod,
      severity: paymentVendorDowntimeModel.severity,
      type: paymentVendorDowntimeModel.type,
      currentDowntimeStates: paymentVendorDowntimeModel.currentDowntimeStates,
    })
    .from(paymentVendorDowntimeModel)
    .where(eq(paymentVendorDowntimeModel.vendor, VENDOR_PAYTM));

  const active = rows.filter((r) => {
    const st = (r.currentDowntimeStates ?? "").trim().toUpperCase();
    if (st === "CLOSED") return false;
    return true;
  });

  let blocking: OnlinePaymentAvailabilityResult["blockingDowntimes"] = [];
  let degraded = false;

  for (const r of active) {
    if (!isCoreOnlinePayMethod(r.payMethod)) continue;
    const sev = r.severity ?? "";
    if (isSevereSeverity(sev)) {
      blocking.push({
        vendorDowntimeId: r.vendorDowntimeId,
        payMethod: r.payMethod,
        severity: r.severity,
        type: r.type,
      });
    } else if (isModerateOrFluctuation(sev)) {
      degraded = true;
    }
  }

  const available = blocking.length === 0;

  return {
    vendor: VENDOR_PAYTM,
    available,
    degraded: degraded && available,
    activeDowntimeCount: active.length,
    blockingDowntimes: blocking,
  };
}

export async function runPaytmDowntimePoll(): Promise<void> {
  const { fetchPaytmCurrentDowntime } =
    await import("./paytm-payment.service.js");
  const result = await fetchPaytmCurrentDowntime();
  if (!result.success) {
    console.error("[Paytm downtime poll]", result.error);
    return;
  }
  await syncPaytmDowntimeFromFetch(result.states ?? []);
}
