/**
 * Dashboard metrics mapped to Academic360 schema (wire to API later).
 */

export type MetricId =
  | "fee_receivable"
  | "fee_collected"
  | "fee_pending"
  | "total_students"
  | "eligible_students"
  | "fully_paid"
  | "partial_or_unpaid"
  | "collection_rate"
  | "challans_generated"
  | "challans_pending"
  | "today_collected"
  | "today_challans"
  | "online_receipts"
  | "cash_receipts"
  | "cheque_receipts"
  | "cash_collected"
  | "online_collected"
  | "failed_payments"
  | "waived_amount"
  | "late_fee_due"
  | "fee_structures_total"
  | "semester_fee_scopes_open"
  | "fee_slabs_registered"
  | "fee_categories_count"
  | "fee_groups_count";

export type FeesDashboardTab =
  | "overview"
  | "enrollment"
  | "collections"
  | "transactions"
  | "challans"
  | "structures"
  | "slabs"
  | "receipts"
  | "reports"
  | "realtime";

export interface DashboardMetric {
  id: MetricId;
  label: string;
  hint: string;
}

export const ALL_METRICS: Record<MetricId, DashboardMetric> = {
  fee_receivable: { id: "fee_receivable", label: "Fee receivable", hint: "Total payable" },
  fee_collected: { id: "fee_collected", label: "Collected", hint: "Amount paid" },
  fee_pending: { id: "fee_pending", label: "Pending", hint: "receivable − collected" },
  total_students: { id: "total_students", label: "Total students", hint: "enrolled in scope" },
  eligible_students: {
    id: "eligible_students",
    label: "Eligible students",
    hint: "fee mapping exists · promotion",
  },
  fully_paid: { id: "fully_paid", label: "Fully paid", hint: "paid ≥ payable" },
  partial_or_unpaid: { id: "partial_or_unpaid", label: "Partial / unpaid", hint: "below payable" },
  collection_rate: {
    id: "collection_rate",
    label: "Collection rate",
    hint: "collected ÷ receivable",
  },
  challans_generated: {
    id: "challans_generated",
    label: "Challans issued",
    hint: "challanGeneratedAt set",
  },
  challans_pending: { id: "challans_pending", label: "Challan pending", hint: "no challan yet" },
  today_collected: {
    id: "today_collected",
    label: "Collected today",
    hint: "payments SUCCESS · today",
  },
  today_challans: {
    id: "today_challans",
    label: "Challans today",
    hint: "challanGeneratedAt · today",
  },
  online_receipts: {
    id: "online_receipts",
    label: "Online receipts",
    hint: "payments · ONLINE · SUCCESS",
  },
  cash_receipts: {
    id: "cash_receipts",
    label: "Cash receipts",
    hint: "staff-marked · CASH · SUCCESS",
  },
  cheque_receipts: {
    id: "cheque_receipts",
    label: "Cheque receipts",
    hint: "staff-marked · CHEQUE · SUCCESS",
  },
  cash_collected: { id: "cash_collected", label: "Cash collected", hint: "CASH + CHEQUE amount" },
  online_collected: { id: "online_collected", label: "Online collected", hint: "ONLINE amount" },
  failed_payments: { id: "failed_payments", label: "Failed", hint: "payments FAILED" },
  waived_amount: { id: "waived_amount", label: "Waived", hint: "Waived off amount" },
  late_fee_due: { id: "late_fee_due", label: "Late fee", hint: "Late fee due" },
  fee_structures_total: {
    id: "fee_structures_total",
    label: "Fee structures",
    hint: "fee_structures rows",
  },
  semester_fee_scopes_open: {
    id: "semester_fee_scopes_open",
    label: "Payment windows open",
    hint: "Semester Fee Payment · in date",
  },
  fee_slabs_registered: {
    id: "fee_slabs_registered",
    label: "Fee slabs",
    hint: "fee_slabs master",
  },
  fee_categories_count: {
    id: "fee_categories_count",
    label: "Fee categories",
    hint: "concession category",
  },
  fee_groups_count: { id: "fee_groups_count", label: "Fee groups", hint: "category × slab" },
};

export const TAB_METRICS: Record<FeesDashboardTab, MetricId[]> = {
  overview: ["fee_receivable", "fee_collected", "fee_pending", "total_students"],
  enrollment: ["fee_receivable", "fee_collected", "challans_generated", "challans_pending"],
  collections: ["fee_receivable", "fee_collected", "fee_pending", "collection_rate"],
  transactions: ["online_collected", "cash_collected", "cash_receipts", "cheque_receipts"],
  challans: ["challans_generated", "challans_pending", "eligible_students", "fee_pending"],
  structures: [
    "fee_structures_total",
    "semester_fee_scopes_open",
    "fee_receivable",
    "eligible_students",
  ],
  slabs: ["fee_slabs_registered", "fee_categories_count", "eligible_students", "fee_groups_count"],
  receipts: ["fee_collected", "online_collected", "cash_collected", "online_receipts"],
  reports: ["fee_receivable", "fee_collected", "fee_pending", "total_students"],
  realtime: ["eligible_students", "online_receipts", "cash_receipts", "cheque_receipts"],
};

/** Shown below main KPI row on selected tabs */
export const TAB_TODAY_METRICS: Partial<Record<FeesDashboardTab, MetricId[]>> = {
  overview: ["today_collected", "today_challans"],
  transactions: ["today_collected", "today_challans"],
};

export interface MetricValues {
  fee_receivable: number;
  fee_collected: number;
  fee_pending: number;
  total_students: number;
  eligible_students: number;
  fully_paid: number;
  partial_or_unpaid: number;
  collection_rate: number;
  challans_generated: number;
  challans_pending: number;
  today_collected: number;
  today_challans: number;
  online_receipts: number;
  cash_receipts: number;
  cheque_receipts: number;
  cash_collected: number;
  online_collected: number;
  failed_payments: number;
  waived_amount: number;
  late_fee_due: number;
  fee_structures_total: number;
  semester_fee_scopes_open: number;
  fee_slabs_registered: number;
  fee_categories_count: number;
  fee_groups_count: number;
}

export const MOCK_METRIC_VALUES: MetricValues = {
  fee_receivable: 375_740_000,
  fee_collected: 309_030_000,
  fee_pending: 66_710_000,
  total_students: 10023,
  eligible_students: 10023,
  fully_paid: 6542,
  partial_or_unpaid: 3481,
  collection_rate: 82.3,
  challans_generated: 9842,
  challans_pending: 1181,
  today_collected: 18_450_000,
  today_challans: 142,
  online_receipts: 8412,
  cash_receipts: 612,
  cheque_receipts: 148,
  cash_collected: 18_400_000,
  online_collected: 290_630_000,
  failed_payments: 127,
  waived_amount: 4_200_000,
  late_fee_due: 1_850_000,
  fee_structures_total: 48,
  semester_fee_scopes_open: 12,
  fee_slabs_registered: 8,
  fee_categories_count: 6,
  fee_groups_count: 24,
};

const INR_METRIC_IDS: Set<MetricId> = new Set([
  "fee_receivable",
  "fee_collected",
  "fee_pending",
  "waived_amount",
  "late_fee_due",
  "cash_collected",
  "online_collected",
  "today_collected",
]);

export function formatMetricValue(id: MetricId, values: MetricValues): string {
  if (INR_METRIC_IDS.has(id)) {
    return formatInr(values[id]);
  }
  if (id === "collection_rate") {
    return `${values[id]}%`;
  }
  return values[id].toLocaleString("en-IN");
}

/** ₹ with K / L / Cr (Indian numbering) */
export function formatInr(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${trimTrailingZeros(amount / 1_00_00_000)} Cr`;
  if (abs >= 1_00_000) return `₹${trimTrailingZeros(amount / 1_00_000)} L`;
  if (abs >= 1_000) return `₹${trimTrailingZeros(amount / 1_000)} K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function trimTrailingZeros(n: number): string {
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, "");
}
