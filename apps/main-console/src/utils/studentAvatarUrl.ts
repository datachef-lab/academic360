/**
 * Returns the URL to the unified student-avatar resolver on the backend.
 * The backend runs the S3 → besc → hrclIRP → previous-uid chain; on 404 the
 * caller's <img onError> fallback (initials, icon, etc.) takes over.
 */
const API_BASE = import.meta.env.VITE_APP_BACKEND_URL ?? "";

export function studentAvatarUrl(uid?: string | null): string | undefined {
  if (!uid) return undefined;
  return `${API_BASE}/api/students/uid/${encodeURIComponent(uid)}/avatar`;
}
