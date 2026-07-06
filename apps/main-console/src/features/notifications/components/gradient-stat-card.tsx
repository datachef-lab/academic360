import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type GradientStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** Tailwind gradient stops, e.g. "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]" */
  gradient: string;
  progress?: number;
  className?: string;
};

/** Full-bleed gradient KPI card — same visual recipe as the fees MetricCard. */
export function GradientStatCard({
  label,
  value,
  hint,
  icon: Icon,
  gradient,
  progress,
  className,
}: GradientStatCardProps) {
  return (
    <article
      className={cn(
        "relative min-w-[150px] flex-1 overflow-hidden rounded-lg bg-gradient-to-br p-3 shadow-md",
        gradient,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-black/5" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-white/90">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>

      <p className="relative mt-2 text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">
        {value}
      </p>

      {hint && (
        <p className="relative mt-2 truncate text-xs text-white/80" title={hint}>
          {hint}
        </p>
      )}

      {progress !== undefined && (
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white/90"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </article>
  );
}
