/** "10:00" | "14:30" → "10 AM" | "2:30 PM" */
export function formatHourTo12h(hour24: string): string {
  const match = hour24.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return hour24;

  const hourPart = match[1];
  if (hourPart === undefined) return hour24;
  const hours = parseInt(hourPart, 10);
  const minutes = match[2] ?? "00";
  if (hours < 0 || hours > 23) return hour24;

  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;

  if (minutes === "00") {
    return `${h12} ${period}`;
  }
  return `${h12}:${minutes} ${period}`;
}

/** Program tick: show program name as-is */
export function formatProgramTick(value: string): string {
  return value?.trim() || "—";
}

/** Month tick: ensure "Month YYYY" from label or ISO month key */
export function formatMonthYearTick(value: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "—";

  const iso = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }

  return trimmed;
}

/** "April 2025" → "Apr '25" for dense chart strips */
export function formatMonthYearTickShort(value: string): string {
  const full = formatMonthYearTick(value);
  const parts = full.split(/\s+/);
  const monthPart = parts[0];
  const yearPart = parts[1];
  if (monthPart && yearPart) {
    const month = monthPart.slice(0, 3);
    const year = yearPart.length === 4 ? yearPart.slice(-2) : yearPart;
    return `${month} '${year}`;
  }
  return full.length > 10 ? `${full.slice(0, 8)}…` : full;
}
