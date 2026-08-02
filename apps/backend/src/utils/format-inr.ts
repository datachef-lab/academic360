/**
 * Indian-rupee formatter for spreadsheet exports.
 *
 * Mirrors `formatInrMoneyForExcel` in
 * `apps/backend/src/features/fees/services/fee-structure.service.ts:2682`
 * so library reports render prices identically to fee-structure exports:
 * Unicode `₹` (U+20B9) prefix + `en-IN` grouping (lakhs / crores).
 *
 * Values arrive as `number`, `string` (varchar columns like
 * `copy_details.price_in_inr`), `bigint`, or `null` — handle all of them.
 * A cell that has no meaningful value renders as an empty string, not `₹ 0`.
 */
export function formatInrForExcel(
  value: number | string | bigint | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "bigint") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return formatInrForExcel(n);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return "";
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return trimmed;
    return formatInrForExcel(n);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    if (value === 0) return "";
    const hasDecimals = Math.abs(value % 1) > 1e-9;
    const formatted = value.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `₹ ${formatted}`;
  }
  return "";
}

/**
 * Compact INR — shortens large amounts to `k / L / Cr` so a stock summary
 * showing `₹ 3.25 Cr` reads at a glance instead of `₹ 3,24,97,524.16`.
 *
 *   < 1,000            → exact rupees with commas (`₹ 987`)
 *   1,000 – 99,999     → `k` (`₹ 12.5 k`)
 *   1,00,000 – 99,99,999 → `L` (`₹ 3.25 L`)
 *   ≥ 1 crore          → `Cr` (`₹ 3.25 Cr`)
 *
 * Two significant fractional digits, dropped when the number is whole
 * (`₹ 5 L`, not `₹ 5.00 L`).
 */
export function formatInrCompactForExcel(
  value: number | string | bigint | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const n =
    typeof value === "number"
      ? value
      : typeof value === "bigint"
        ? Number(value)
        : Number(String(value).trim());
  if (!Number.isFinite(n) || n === 0)
    return typeof value === "string" ? value : "";
  const abs = Math.abs(n);
  const round2 = (x: number) => {
    const s = (Math.round(x * 100) / 100).toString();
    return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  };
  if (abs >= 10_000_000) return `₹ ${round2(n / 10_000_000)} Cr`;
  if (abs >= 100_000) return `₹ ${round2(n / 100_000)} L`;
  if (abs >= 1_000) return `₹ ${round2(n / 1_000)} k`;
  return `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/**
 * Plain integer count with en-IN grouping — no currency prefix.
 * `1234567` → `"12,34,567"`. Used for counts (number of copies, times issued,
 * etc.) so big numbers stay readable in Excel.
 */
export function formatIntIN(
  value: number | string | bigint | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "bigint") return formatIntIN(Number(value));
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") return "";
    const n = Number(t);
    return Number.isFinite(n) ? formatIntIN(n) : t;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Math.round(value).toLocaleString("en-IN");
  }
  return "";
}
