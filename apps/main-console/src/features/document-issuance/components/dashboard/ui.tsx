import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  CheckCircle2,
  CircleCheckBig,
  Upload,
  Lock,
  RefreshCw,
  Package,
  Unlock,
  Inbox,
  Users,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

/** White panel shell used for every non-KPI widget on the Documents Dashboard —
 *  same recipe as fees-dashboard's VisualCard. */
export function DashboardPanel({
  title,
  subtitle,
  headerRight,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[#d4d4d4] bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#ebebeb] bg-[#fafafa] px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#888]">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

const KPI_ICONS: Record<string, LucideIcon> = {
  file: FileText,
  clock: Clock,
  check: CheckCircle2,
  circleCheckBig: CircleCheckBig,
  upload: Upload,
  lock: Lock,
  refresh: RefreshCw,
  package: Package,
  unlock: Unlock,
  inbox: Inbox,
  users: Users,
  rupee: IndianRupee,
};

/** Full-bleed gradient KPI tile — same visual recipe as GradientStatCard. */
export function GradientKpi({
  label,
  value,
  hint,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  gradient: string;
  icon?: keyof typeof KPI_ICONS;
}) {
  const Icon = icon ? KPI_ICONS[icon] : undefined;
  return (
    <article
      className={cn(
        "relative min-w-[150px] flex-1 overflow-hidden rounded-lg bg-gradient-to-br p-4 shadow-md",
        gradient,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-4 -right-2 h-10 w-10 rounded-full bg-white/20" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85">{label}</p>
        {Icon && <Icon className="h-5 w-5 shrink-0 text-white/60" />}
      </div>
      <p className="relative mt-2 text-[26px] font-bold leading-none tracking-tight text-white tabular-nums">
        {value}
      </p>
      {hint && <p className="relative mt-2 truncate text-xs text-white/75">{hint}</p>}
    </article>
  );
}

const TONE_STYLES = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  slate: "border-[#e2e2e2] bg-[#f5f5f5] text-[#666]",
} as const;

export type Tone = keyof typeof TONE_STYLES;

/** Small pill badge — used for status/category chips throughout the dashboard. */
export function Chip({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Horizontal proportional bar (a value against an implicit max), used for
 *  mode-mix / pending-by-type / blocks-by-type / leaderboard rows. */
export function ProportionBar({
  value,
  max,
  tone = "violet",
}: {
  value: number;
  max: number;
  tone?: Tone;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(2, (value / max) * 100)) : 0;
  const fill =
    tone === "amber"
      ? "bg-amber-500"
      : tone === "red"
        ? "bg-red-500"
        : tone === "green"
          ? "bg-emerald-500"
          : tone === "blue"
            ? "bg-sky-500"
            : "bg-violet-500";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#efefef]">
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SectionTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
