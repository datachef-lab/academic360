import {
  Mail,
  MessageCircle,
  MessageSquareText,
  Globe,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const VARIANT_META: Record<string, { cls: string; Icon: LucideIcon }> = {
  // Email blue (red is reserved for failed/inactive states), WhatsApp green.
  EMAIL: { cls: "bg-sky-100 text-sky-700 border-sky-300", Icon: Mail },
  WHATSAPP: { cls: "bg-emerald-100 text-emerald-700 border-emerald-300", Icon: MessageCircle },
  SMS: { cls: "bg-amber-100 text-amber-700 border-amber-300", Icon: MessageSquareText },
  WEB: { cls: "bg-violet-100 text-violet-700 border-violet-300", Icon: Globe },
  OTHER: { cls: "bg-gray-100 text-gray-600 border-gray-300", Icon: MoreHorizontal },
};

const STATUS_STYLES: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PENDING: "bg-amber-100 text-amber-700 border-amber-300",
  FAILED: "bg-rose-100 text-rose-700 border-rose-300",
};

const FALLBACK_META = {
  cls: "bg-gray-100 text-gray-600 border-gray-300",
  Icon: MoreHorizontal,
} as const;

export function VariantBadge({ variant }: { variant: string }) {
  const meta = VARIANT_META[variant] ?? FALLBACK_META;
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
    >
      <Icon className="h-3 w-3" />
      {variant}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        active
          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
          : "border-rose-300 bg-rose-100 text-rose-700"
      }`}
    >
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
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
      title={status === "FAILED" && failedReason ? failedReason : undefined}
    >
      {status}
    </span>
  );
}
