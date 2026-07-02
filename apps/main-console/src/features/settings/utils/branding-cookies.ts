import type { BrandingData } from "@/features/settings/types/branding.type";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const COOKIE_KEYS = {
  collegeName: "ac360_college_name",
  abbreviation: "ac360_college_abbr",
  logoUrl: "ac360_logo_url",
  loginScreenUrl: "ac360_login_screen_url",
} as const;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined" || !value) {
    return;
  }

  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readBrandingFromCookies(): BrandingData | null {
  const collegeName = getCookie(COOKIE_KEYS.collegeName);
  const abbreviation = getCookie(COOKIE_KEYS.abbreviation);

  if (!collegeName && !abbreviation) {
    return null;
  }

  return {
    collegeName: collegeName ?? "",
    abbreviation: abbreviation ?? "",
    logoUrl: getCookie(COOKIE_KEYS.logoUrl),
    loginScreenUrl: getCookie(COOKIE_KEYS.loginScreenUrl),
  };
}

export function writeBrandingToCookies(branding: BrandingData): void {
  if (branding.collegeName) {
    setCookie(COOKIE_KEYS.collegeName, branding.collegeName);
  }
  if (branding.abbreviation) {
    setCookie(COOKIE_KEYS.abbreviation, branding.abbreviation);
  }
  if (branding.logoUrl) {
    setCookie(COOKIE_KEYS.logoUrl, branding.logoUrl);
  }
  if (branding.loginScreenUrl) {
    setCookie(COOKIE_KEYS.loginScreenUrl, branding.loginScreenUrl);
  }
}
