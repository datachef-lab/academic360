/**
 * Builds the URL to the unified backend avatar resolver. The backend runs
 * the S3 → besc → hrclIRP → previous-uid chain server-side; on 404 the
 * caller should render initials locally.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function getStudentImageUrl(uid?: string | null): string | null {
  if (!uid) return null;
  if (!API_BASE) return null;
  return `${API_BASE}/api/students/uid/${encodeURIComponent(uid)}/avatar`;
}
