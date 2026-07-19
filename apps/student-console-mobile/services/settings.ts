import axiosInstance, { API_BASE_URL } from "@/lib/api";

export type Branding = {
  collegeName?: string;
  abbreviation?: string;
  logoUrl?: string;
  loginScreenUrl?: string;
};

/** Generic persisted-file URL (mirrors the web `getSettingFileUrl`), with an
 * optional `updatedAt` cache-buster. */
export function getSettingFileUrl(fileId: number | string, updatedAt?: string | number): string {
  const url = `${API_BASE_URL}/api/v1/settings/file/${fileId}`;
  return updatedAt != null ? `${url}?v=${encodeURIComponent(String(updatedAt))}` : url;
}

/** The backend builds absolute file URLs from its own host config — in dev
 * that's "http://localhost:8080/…", which on a phone points at the phone
 * itself and the image never loads. Re-base onto the API host the app is
 * actually talking to. (String surgery, not `new URL()` — Hermes' URL
 * support is partial.) */
function rebaseToApi(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.replace(/^https?:\/\/[^/]+/, API_BASE_URL.replace(/\/+$/, ""));
}

/** College branding (name, abbreviation, logo). Returns null on failure so
 * callers can fall back to a bundled/known-good default. */
export async function getBranding(): Promise<Branding | null> {
  try {
    const res = await axiosInstance.get("/api/v1/settings/branding");
    const branding = (res.data?.payload ?? res.data ?? null) as Branding | null;
    if (branding) {
      branding.logoUrl = rebaseToApi(branding.logoUrl);
      branding.loginScreenUrl = rebaseToApi(branding.loginScreenUrl);
    }
    return branding;
  } catch {
    return null;
  }
}
