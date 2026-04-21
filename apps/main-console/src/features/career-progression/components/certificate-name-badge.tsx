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
    "inline-flex max-w-[min(100%,280px)] min-w-0 overflow-hidden border-0 shadow-none hover:opacity-95";
  if (fg || bg) {
    return (
      <Badge
        className={badgeShell}
        style={{
          color: fg ?? "#fafafa",
          backgroundColor: bg ?? "hsl(262.1 83.3% 57.8%)",
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
