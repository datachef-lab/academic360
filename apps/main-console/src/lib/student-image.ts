/**
 * Main-console student image helper.
 * Uses Vite env `VITE_STUDENT_PROFILE_URL` if present, otherwise falls back to the known server.
 */
export const STUDENT_IMAGE_BASE =
  import.meta.env.VITE_STUDENT_PROFILE_URL ?? "https://74.207.233.48:8443/hrclIRP/studentimages";

export function getStudentImageUrl(uid?: string | null): string | null {
  if (!uid) return null;
  return `${STUDENT_IMAGE_BASE}/Student_Image_${uid}.jpg`;
}
