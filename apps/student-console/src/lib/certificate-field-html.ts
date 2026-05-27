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

/** HTML safe for student form display (supports legacy plain text). */
export function certificateFieldDescriptionDisplayHtml(html: string | null | undefined): string {
  if (isCertificateFieldDescriptionEmpty(html)) return "";
  const trimmed = html!.trim();
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeCertificateFieldDescriptionHtml(trimmed);
  }
  const escaped = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return sanitizeCertificateFieldDescriptionHtml(`<p>${escaped.replace(/\n/g, "<br>")}</p>`);
}
