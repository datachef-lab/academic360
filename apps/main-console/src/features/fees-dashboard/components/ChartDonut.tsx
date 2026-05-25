import { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type DonutSlice = { name: string; value: number; color: string };

type ChartDonutProps = {
  data: DonutSlice[];
  centerLabel?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tooltipFormatter?: (value: number, name: string) => string;
};

export function ChartDonut({
  data,
  centerLabel,
  footer,
  className,
  tooltipFormatter,
}: ChartDonutProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col", className)}>
      <div className="relative mx-auto aspect-square w-full min-h-[180px] max-w-[240px] sm:min-h-[200px] sm:max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) =>
                tooltipFormatter ? tooltipFormatter(v, name) : `${v}`
              }
            />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            {centerLabel}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
