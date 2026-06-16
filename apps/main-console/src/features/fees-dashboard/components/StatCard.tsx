import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  variant: "indigo" | "emerald" | "rose" | "cyan" | "amber" | "violet" | "sky" | "pink";
  className?: string;
};

const STYLES = {
  indigo: { header: "bg-indigo-600", value: "text-indigo-700" },
  emerald: { header: "bg-emerald-600", value: "text-emerald-700" },
  rose: { header: "bg-rose-600", value: "text-rose-700" },
  cyan: { header: "bg-cyan-600", value: "text-cyan-700" },
  amber: { header: "bg-amber-600", value: "text-amber-700" },
  violet: { header: "bg-violet-600", value: "text-violet-700" },
  sky: { header: "bg-sky-600", value: "text-sky-700" },
  pink: { header: "bg-pink-600", value: "text-pink-700" },
};

export function StatCard({ label, value, trend, icon: Icon, variant, className }: StatCardProps) {
  const style = STYLES[variant];
  const positive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "flex min-w-[140px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm",
        className,
      )}
    >
      <div className={cn("flex items-center justify-between px-3 py-2", style.header)}>
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-white">
          {label}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-white/90" />
      </div>
      <div className="px-3 py-2.5">
        <p className={cn("text-xl font-bold leading-tight tabular-nums", style.value)}>{value}</p>
        {trend !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-0.5 text-[11px] font-medium",
              positive ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}
