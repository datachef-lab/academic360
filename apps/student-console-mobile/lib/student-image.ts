import { API_BASE_URL } from "@/lib/api";

/**
 * Builds the URL to the unified backend avatar resolver. The backend runs
 * the S3 → besc → hrclIRP → previous-uid chain server-side; on 404 the
 * caller should render initials locally (see components/ui/Avatar).
 */
export function getStudentImageUrl(uid?: string | null): string | null {
  if (!uid || !API_BASE_URL) return null;
  return `${API_BASE_URL}/api/students/uid/${encodeURIComponent(uid)}/avatar`;
}
