/**
 * Base URL for student profile images.
 * Configure via EXPO_PUBLIC_STUDENT_IMAGE_URL in .env
 */
export const STUDENT_IMAGE_BASE =
  process.env.EXPO_PUBLIC_STUDENT_IMAGE_URL ?? "https://74.207.233.48:8443/hrclIRP/studentimages";

/**
 * Returns the student image URL for the given UID.
 * Use this for all student avatars - fallback to initials when image fails to load.
 */
export function getStudentImageUrl(uid?: string | null): string | null {
  if (!uid) return null;
  return `${STUDENT_IMAGE_BASE}/Student_Image_${uid}.jpg`;
}
