export const getInitials = (name?: string | null): string => {
  if (!name?.trim()) return "U";
  const names = name.trim().split(/\s+/);
  const first = names[0]?.charAt(0).toUpperCase() || "";
  const last = names.length > 1 ? names[names.length - 1]?.charAt(0).toUpperCase() : "";
  return `${first}${last}`;
};

export const getColorFromName = (name?: string | null): string => {
  if (!name) return "bg-gray-400";
  const colors = [
    "bg-purple-600",
    "bg-amber-800",
    "bg-green-600",
    "bg-yellow-600",
    "bg-red-600",
    "bg-indigo-600",
    "bg-pink-600",
    "bg-teal-600",
  ];
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || "bg-gray-400";
};
