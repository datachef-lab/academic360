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

/** College branding (name, abbreviation, logo). Returns null on failure so
 * callers can fall back to a bundled/known-good default. */
export async function getBranding(): Promise<Branding | null> {
  try {
    const res = await axiosInstance.get("/api/v1/settings/branding");
    return (res.data?.payload ?? res.data ?? null) as Branding | null;
  } catch {
    return null;
  }
}
