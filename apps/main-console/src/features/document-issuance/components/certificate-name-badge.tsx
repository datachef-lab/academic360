import { Badge } from "@/components/ui/badge";

export function CertificateNameBadge({
  name,
  color,
  bgColor,
}: {
  name: string;
  color: string | null;
  bgColor: string | null;
}) {
  const fg = color?.trim() || null;
  const bg = bgColor?.trim() || null;
  const badgeShell =
    "inline-flex max-w-[min(100%,280px)] min-w-0 overflow-hidden border shadow-none hover:opacity-95";
  if (fg || bg) {
    const outline = fg ?? "#fafafa";
    return (
      <Badge
        className={badgeShell}
        style={{
          color: outline,
          backgroundColor: bg ?? "hsl(262.1 83.3% 57.8%)",
          // Derived from the admin-chosen text colour so the outline works for
          // any pair they pick; falls back to the flat colour where color-mix
          // is unsupported.
          borderColor: outline,
        }}
        title={name}
      >
        <span className="min-w-0 truncate">{name}</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={`${badgeShell} border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100`}
      title={name}
    >
      <span className="min-w-0 truncate">{name}</span>
    </Badge>
  );
}
