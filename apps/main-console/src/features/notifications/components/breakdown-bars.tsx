import type { DimBucket } from "@/features/notifications/api/notifications-api";
import { formatCompactIN } from "@/features/notifications/utils/format";

// Fixed categorical cycle — color follows row order, "Other" stays gray.
const BAR_COLORS = [
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#4f46e5", // indigo
  "#0284c7", // sky
  "#c026d3", // fuchsia
  "#65a30d", // lime
  "#ea580c", // orange
];
const OTHER_COLOR = "#94a3b8";

/**
 * Horizontal magnitude bar list (top-N + Other) used across the notifications
 * dashboard breakdowns: label + share% + count, solid colored bars.
 */
export function BreakdownBars({ buckets, limit = 10 }: { buckets: DimBucket[]; limit?: number }) {
  const sorted = [...buckets].sort((a, b) => b.count - a.count);
  const shown = sorted.slice(0, limit);
  const hidden = sorted.slice(limit).reduce((s, b) => s + b.count, 0);
  if (hidden > 0) shown.push({ key: "__other", label: "Other", count: hidden });
  const max = Math.max(1, ...shown.map((b) => b.count));
  const total = Math.max(
    1,
    sorted.reduce((s, b) => s + b.count, 0),
  );

  if (shown.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">No data</p>;
  }

  return (
    <ul className="space-y-2.5">
      {shown.map((b, i) => {
        const color = b.key === "__other" ? OTHER_COLOR : BAR_COLORS[i % BAR_COLORS.length];
        const share = Math.round((b.count / total) * 100);
        return (
          <li key={b.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium text-[#333]" title={b.label}>
                {b.label}
              </span>
              <span className="shrink-0 tabular-nums text-[#888]">
                {share}% ·{" "}
                <span
                  className="font-semibold text-[#1a1a1a]"
                  title={b.count.toLocaleString("en-IN")}
                >
                  {formatCompactIN(b.count)}
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${Math.max((b.count / max) * 100, b.count > 0 ? 2 : 0)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
