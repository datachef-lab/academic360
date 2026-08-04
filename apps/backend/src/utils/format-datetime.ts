/**
 * Report-friendly date + datetime formatters, both fixed to Asia/Kolkata so
 * a librarian in India reads times in the timezone they actually operate in
 * (not UTC, not the server locale).
 *
 * Every library-report Excel exporter formats dates through these helpers so
 * the output is consistent across every workbook:
 *   `formatIstDateTime`  → `"02/08/2026 08:15 PM"`
 *   `formatIstDate`      → `"02/08/2026"`
 *
 * Both accept either a `Date` (what the pg driver returns for `timestamptz`
 * columns) or an ISO string (what `db.execute(sql\`...\`)` sometimes returns
 * for raw SQL projections), and both return an empty string for null /
 * undefined / invalid input so cell rendering never blows up on missing
 * data.
 */

const IST_ZONE = "Asia/Kolkata";
const LOCALE = "en-GB"; // en-GB gives the dd/mm/yyyy order out of the box.

function toDate(v: Date | string | null | undefined): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dtFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: IST_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: IST_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Format a Date (or ISO string) as `dd/mm/yyyy hh:mm AM/PM` in Asia/Kolkata.
 * Returns `""` for null / undefined / invalid input.
 *
 * `Intl.DateTimeFormat` emits a locale-formatted string; en-GB in the year
 * 2026 places the AM/PM marker with a space (e.g. `"02/08/2026, 08:15 pm"`),
 * so we uppercase the meridiem and drop the comma to match the exact shape
 * the product owner asked for (`"02/08/2026 08:15 PM"`).
 */
export function formatIstDateTime(v: Date | string | null | undefined): string {
  const d = toDate(v);
  if (!d) return "";
  // `.format(d)` → e.g. `"02/08/2026, 08:15 pm"`. Keep the comma after the
  // date (product preference — makes date vs time easier to scan) and
  // uppercase the meridiem for consistency.
  return dtFormatter.format(d).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

/**
 * Date-only variant. `"02/08/2026"`.
 */
export function formatIstDate(v: Date | string | null | undefined): string {
  const d = toDate(v);
  if (!d) return "";
  return dFormatter.format(d);
}
