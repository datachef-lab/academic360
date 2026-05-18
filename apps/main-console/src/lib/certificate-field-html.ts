import DOMPurify, { type Config } from "dompurify";

const SANITIZE_OPTIONS: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "ul",
    "ol",
    "li",
    "a",
    "span",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
};

/** True when Quill/HTML content has no visible text. */
export function isCertificateFieldDescriptionEmpty(html: string | null | undefined): boolean {
  if (html == null) return true;
  const trimmed = html.trim();
  if (!trimmed) return true;
  const textOnly = trimmed
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return textOnly.length === 0;
}

export function sanitizeCertificateFieldDescriptionHtml(html: string): string {
  return String(DOMPurify.sanitize(html, SANITIZE_OPTIONS));
}

/** Normalize editor output for API: null when empty, otherwise sanitized HTML. */
export function normalizeCertificateFieldDescriptionForSave(
  html: string | null | undefined,
): string | null {
  if (isCertificateFieldDescriptionEmpty(html)) return null;
  return sanitizeCertificateFieldDescriptionHtml(html!.trim());
}

/** Load legacy plain-text descriptions into the editor as a single paragraph. */
export function certificateFieldDescriptionForEditor(value: string | null | undefined): string {
  if (value == null || !value.trim()) return "";
  const trimmed = value.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  const escaped = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}

export function certificateFieldDescriptionPreviewHtml(html: string | null | undefined): string {
  if (isCertificateFieldDescriptionEmpty(html)) return "";
  const trimmed = html!.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeCertificateFieldDescriptionHtml(trimmed);
  }
  const escaped = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return sanitizeCertificateFieldDescriptionHtml(`<p>${escaped.replace(/\n/g, "<br>")}</p>`);
}
