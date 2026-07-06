import {
  Mail,
  MessageCircle,
  MessageSquareText,
  Globe,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

// Soft-ring badge style: light tint, saturated text, thin inset ring. Cleaner
// and more legible than heavy -100 fill + -300 border pastels.
const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset";

const VARIANT_META: Record<string, { cls: string; Icon: LucideIcon }> = {
  EMAIL: { cls: "bg-sky-50 text-sky-700 ring-sky-600/20", Icon: Mail },
  WHATSAPP: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: MessageCircle },
  SMS: { cls: "bg-amber-50 text-amber-700 ring-amber-600/20", Icon: MessageSquareText },
  WEB: { cls: "bg-violet-50 text-violet-700 ring-violet-600/20", Icon: Globe },
  OTHER: { cls: "bg-gray-50 text-gray-600 ring-gray-500/20", Icon: MoreHorizontal },
};

const STATUS_STYLES: Record<string, string> = {
  SENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const FALLBACK_META = {
  cls: "bg-gray-50 text-gray-600 ring-gray-500/20",
  Icon: MoreHorizontal,
} as const;

export function VariantBadge({ variant }: { variant: string }) {
  const meta = VARIANT_META[variant] ?? FALLBACK_META;
  const Icon = meta.Icon;
  return (
    <span className={`${BADGE_BASE} ${meta.cls}`}>
      <Icon className="h-3 w-3" />
      {variant}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${BADGE_BASE} ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-rose-50 text-rose-700 ring-rose-600/20"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function StatusBadge({
  status,
  failedReason,
}: {
  status: string;
  failedReason?: string | null;
}) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-50 text-gray-600 ring-gray-500/20";
  return (
    <span
      className={`${BADGE_BASE} ${cls}`}
      title={status === "FAILED" && failedReason ? failedReason : undefined}
    >
      {status}
    </span>
  );
}
