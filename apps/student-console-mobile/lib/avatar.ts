// Single source for avatar initials + a deterministic colour, shared by the
// header, sidebar and profile so the same person always gets the same tile.
const AVATAR_COLORS = [
  "#4F46E5",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#5B21B6",
  "#6D28D9",
];

export function avatarColor(seed?: string | null): string {
  const s = (seed ?? "?").trim() || "?";
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function avatarInitials(name?: string | null): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "S";
}
