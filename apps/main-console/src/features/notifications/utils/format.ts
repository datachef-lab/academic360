/**
 * camelCase / snake_case field key → readable Sentence Case, preserving
 * ALL-CAPS acronyms. "isSCSTOBC" → "Is SCSTOBC", "boardCode" → "Board Code",
 * "hasCURegistration" → "Has CU Registration". Already-spaced names pass through.
 */
export function humanizeFieldName(name: string): string {
  const spaced = name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return spaced
    .split(" ")
    .map((w) => (w && w === w.toLowerCase() ? (w[0] ?? "").toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** 1,234 → "1.2k" · 1,23,456 → "1.2L" · 1,23,45,678 → "1.2Cr" (Indian system). */
export function formatCompactIN(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number, suffix: string) => {
    const r = Math.round(v * 10) / 10;
    return `${Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)}${suffix}`;
  };
  if (abs >= 1_00_00_000) return fmt(n / 1_00_00_000, "Cr");
  if (abs >= 1_00_000) return fmt(n / 1_00_000, "L");
  if (abs >= 1_000) return fmt(n / 1_000, "k");
  return n.toLocaleString("en-IN");
}

export type FriendlyReason = {
  /** Short plain-language summary for naive users. */
  summary: string;
  /** What to do about it. */
  hint?: string;
};

/** Map raw provider error text to a plain-language explanation. */
export function humanizeFailureReason(reason: string): FriendlyReason {
  const r = reason.toLowerCase();

  if (r.includes("wallet") && r.includes("balance"))
    return {
      summary: "WhatsApp wallet has insufficient balance",
      hint: "Recharge the Interakt WhatsApp wallet to resume delivery.",
    };
  if (
    r.includes("http 504") ||
    r.includes("timed out") ||
    r.includes("timeout") ||
    r.includes("<!doctype")
  )
    return {
      summary: "Message gateway did not respond (timeout)",
      hint: "Temporary provider outage — resend later.",
    };
  if (
    r.includes("http 401") ||
    r.includes("http 403") ||
    r.includes("unauthorized") ||
    r.includes("authentication")
  )
    return {
      summary: "Provider authentication failed",
      hint: "The API key/credentials for the provider need attention.",
    };
  if (
    r.includes("invalid") &&
    (r.includes("phone") || r.includes("number") || r.includes("mobile"))
  )
    return {
      summary: "Invalid phone number",
      hint: "The recipient's phone number is missing or malformed.",
    };
  if (r.includes("template rendering failed"))
    return {
      summary: "Template rendering failed",
      hint: "The email template has an error or missing data.",
    };
  if (r.includes("master inactive"))
    return {
      summary: "Template is disabled",
      hint: "The notification master is marked inactive — enable it to send.",
    };
  if (r.includes("zeptomail") || r.includes("smtp") || r.includes("mailbox"))
    return {
      summary: "Email provider rejected the message",
      hint: "Check the recipient address and ZeptoMail status.",
    };
  if (r.includes("http 429") || r.includes("rate limit"))
    return {
      summary: "Provider rate limit reached",
      hint: "Too many messages at once — retries usually succeed.",
    };
  return { summary: "Delivery failed", hint: "See technical details below." };
}
