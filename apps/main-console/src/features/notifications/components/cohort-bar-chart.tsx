import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, type TooltipProps } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { DimBucket } from "@/features/notifications/api/notifications-api";
import { formatCompactIN } from "@/features/notifications/utils/format";

// Fixed categorical cycle — color follows row order, "Other" stays gray.
export const COHORT_COLORS = [
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

const EMPTY_CONFIG = {} satisfies ChartConfig;

function CohortTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as (DimBucket & { fill?: string }) | undefined;
  if (!row) return null;
  return (
    <div className="grid min-w-[8rem] gap-1 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">{row.label}</p>
      <p className="flex items-center gap-1.5 text-[#444]">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.fill }} />
        <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
          {row.count.toLocaleString("en-IN")}
        </span>
      </p>
    </div>
  );
}

type CohortBarChartProps = {
  buckets: DimBucket[];
  limit?: number;
  /** Horizontal bars (category labels on the Y axis) — for long labels. */
  horizontal?: boolean;
  heightClass?: string;
};

/** Colorful categorical bar chart for cohort breakdowns (one color per bar). */
export function CohortBarChart({
  buckets,
  limit = 8,
  horizontal = false,
  heightClass = "h-[260px]",
}: CohortBarChartProps) {
  const data = useMemo(() => {
    const sorted = [...buckets].sort((a, b) => b.count - a.count);
    const shown = sorted.slice(0, limit);
    const hidden = sorted.slice(limit).reduce((s, b) => s + b.count, 0);
    if (hidden > 0) shown.push({ key: "__other", label: "Other", count: hidden });
    return shown.map((b, i) => ({
      ...b,
      fill: b.key === "__other" ? OTHER_COLOR : COHORT_COLORS[i % COHORT_COLORS.length],
    }));
  }, [buckets, limit]);

  if (data.length === 0) {
    return <p className="py-10 text-center text-xs text-muted-foreground">No data</p>;
  }

  if (horizontal) {
    return (
      <ChartContainer config={EMPTY_CONFIG} className={`${heightClass} w-full`}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fontSize: 11, fill: "#444" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)}
          />
          <ChartTooltip content={<CohortTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            label={{
              position: "right",
              fontSize: 11,
              fill: "#555",
              formatter: (v: number) => formatCompactIN(v),
            }}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={EMPTY_CONFIG} className={`${heightClass} w-full`}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#444" }}
          tickLine={false}
          axisLine={{ stroke: "#d4d4d4" }}
          interval={0}
          tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#666" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCompactIN(v)}
          width={48}
        />
        <ChartTooltip content={<CohortTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          label={{
            position: "top",
            fontSize: 11,
            fill: "#555",
            formatter: (v: number) => formatCompactIN(v),
          }}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
