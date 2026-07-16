import { cn } from "@/lib/utils";
import type { TabMetricTheme } from "./TabPanel";
import type { MetricId } from "../data/dashboard-metrics";
import {
  AlertCircle,
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  IndianRupee,
  Layers,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CARD_THEME: Record<MetricId, { gradient: string; icon: LucideIcon; ring: string }> = {
  fee_receivable: {
    gradient: "from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]",
    icon: IndianRupee,
    ring: "bg-white/20",
  },
  fee_collected: {
    gradient: "from-[#047857] via-[#059669] to-[#10b981]",
    icon: Wallet,
    ring: "bg-white/20",
  },
  fee_pending: {
    gradient: "from-[#b91c1c] via-[#dc2626] to-[#ef4444]",
    icon: AlertCircle,
    ring: "bg-white/20",
  },
  total_students: {
    gradient: "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]",
    icon: Users,
    ring: "bg-white/20",
  },
  eligible_students: {
    gradient: "from-[#4338ca] via-[#6366f1] to-[#818cf8]",
    icon: Users,
    ring: "bg-white/20",
  },
  collection_rate: {
    gradient: "from-[#0e7490] via-[#0891b2] to-[#06b6d4]",
    icon: Percent,
    ring: "bg-white/20",
  },
  challans_pending: {
    gradient: "from-[#c2410c] via-[#ea580c] to-[#f97316]",
    icon: FileText,
    ring: "bg-white/20",
  },
  challans_generated: {
    gradient: "from-[#065f46] via-[#0d9488] to-[#14b8a6]",
    icon: Receipt,
    ring: "bg-white/20",
  },
  today_collected: {
    gradient: "from-[#15803d] via-[#22c55e] to-[#4ade80]",
    icon: Calendar,
    ring: "bg-white/20",
  },
  today_challans: {
    gradient: "from-[#7c2d12] via-[#ea580c] to-[#fb923c]",
    icon: Receipt,
    ring: "bg-white/20",
  },
  today_receipts: {
    gradient: "from-[#1e3a8a] via-[#2563eb] to-[#60a5fa]",
    icon: FileText,
    ring: "bg-white/20",
  },
  today_failed_payments: {
    gradient: "from-[#991b1b] via-[#b91c1c] to-[#dc2626]",
    icon: XCircle,
    ring: "bg-white/20",
  },
  receipts_issued: {
    gradient: "from-[#065f46] via-[#0d9488] to-[#14b8a6]",
    icon: Receipt,
    ring: "bg-white/20",
  },
  challan_only: {
    gradient: "from-[#92400e] via-[#b45309] to-[#d97706]",
    icon: FileText,
    ring: "bg-white/20",
  },
  fully_paid: {
    gradient: "from-[#15803d] via-[#16a34a] to-[#22c55e]",
    icon: Wallet,
    ring: "bg-white/20",
  },
  partial_or_unpaid: {
    gradient: "from-[#9a3412] via-[#c2410c] to-[#ea580c]",
    icon: AlertCircle,
    ring: "bg-white/20",
  },
  online_receipts: {
    gradient: "from-[#1e40af] via-[#3b82f6] to-[#60a5fa]",
    icon: Wifi,
    ring: "bg-white/20",
  },
  cash_receipts: {
    gradient: "from-[#a16207] via-[#ca8a04] to-[#eab308]",
    icon: Banknote,
    ring: "bg-white/20",
  },
  cheque_receipts: {
    gradient: "from-[#6b21a8] via-[#9333ea] to-[#c084fc]",
    icon: CreditCard,
    ring: "bg-white/20",
  },
  cash_collected: {
    gradient: "from-[#b45309] via-[#d97706] to-[#fbbf24]",
    icon: Banknote,
    ring: "bg-white/20",
  },
  cheque_collected: {
    gradient: "from-[#854d0e] via-[#a16207] to-[#eab308]",
    icon: Banknote,
    ring: "bg-white/20",
  },
  online_collected: {
    gradient: "from-[#0c4a6e] via-[#0284c7] to-[#38bdf8]",
    icon: Wifi,
    ring: "bg-white/20",
  },
  failed_payments: {
    gradient: "from-[#991b1b] via-[#b91c1c] to-[#dc2626]",
    icon: XCircle,
    ring: "bg-white/20",
  },
  waived_amount: {
    gradient: "from-[#6b21a8] via-[#9333ea] to-[#a855f7]",
    icon: CreditCard,
    ring: "bg-white/20",
  },
  late_fee_due: {
    gradient: "from-[#9a3412] via-[#d97706] to-[#f59e0b]",
    icon: AlertCircle,
    ring: "bg-white/20",
  },
  fee_structures_total: {
    gradient: "from-[#4338ca] via-[#6366f1] to-[#818cf8]",
    icon: Building2,
    ring: "bg-white/20",
  },
  semester_fee_scopes_open: {
    gradient: "from-[#0e7490] via-[#0891b2] to-[#22d3ee]",
    icon: Layers,
    ring: "bg-white/20",
  },
  fee_slabs_registered: {
    gradient: "from-[#6b21a8] via-[#9333ea] to-[#c084fc]",
    icon: Layers,
    ring: "bg-white/20",
  },
  fee_categories_count: {
    gradient: "from-[#be185d] via-[#db2777] to-[#f472b6]",
    icon: Users,
    ring: "bg-white/20",
  },
  fee_groups_count: {
    gradient: "from-[#4c1d95] via-[#7c3aed] to-[#a78bfa]",
    icon: Layers,
    ring: "bg-white/20",
  },
};

/** Challans tab — indigo / violet / amber palette (no green KPI cards). */
const CHALLANS_TAB_THEME: Partial<Record<MetricId, (typeof CARD_THEME)[MetricId]>> = {
  challans_generated: {
    gradient: "from-[#3730a3] via-[#4f46e5] to-[#6366f1]",
    icon: Receipt,
    ring: "bg-white/20",
  },
  challans_pending: {
    gradient: "from-[#b45309] via-[#d97706] to-[#f59e0b]",
    icon: FileText,
    ring: "bg-white/20",
  },
  receipts_issued: {
    gradient: "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]",
    icon: Receipt,
    ring: "bg-white/20",
  },
  fee_collected: {
    gradient: "from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]",
    icon: Wallet,
    ring: "bg-white/20",
  },
  today_collected: {
    gradient: "from-[#312e81] via-[#4338ca] to-[#6366f1]",
    icon: Calendar,
    ring: "bg-white/20",
  },
  today_challans: {
    gradient: "from-[#9a3412] via-[#c2410c] to-[#ea580c]",
    icon: Receipt,
    ring: "bg-white/20",
  },
};

type MetricCardProps = {
  id: MetricId;
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  progress?: number;
  className?: string;
  compact?: boolean;
  theme?: TabMetricTheme;
};

export function MetricCard({
  id,
  label,
  value,
  hint,
  trend,
  progress,
  className,
  compact,
  theme: tabTheme,
}: MetricCardProps) {
  const theme =
    tabTheme === "challans" && CHALLANS_TAB_THEME[id] ? CHALLANS_TAB_THEME[id]! : CARD_THEME[id];
  const Icon = theme.icon;
  const positive = trend !== undefined && trend >= 0;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-br p-3 shadow-md",
        theme.gradient,
        compact && "p-2.5",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-black/5" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-white/90">{label}</p>
        <div
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", theme.ring)}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>

      <p
        className={cn(
          "relative mt-2 font-bold leading-none tracking-tight text-white tabular-nums",
          compact ? "text-xl" : "text-[28px]",
        )}
      >
        {value}
      </p>

      <div className="relative mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        {hint && (
          <span className="min-w-0 flex-1 truncate text-xs text-white/80" title={hint}>
            {hint}
          </span>
        )}
        {trend !== undefined && (
          <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold text-white">
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white/90"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </article>
  );
}
