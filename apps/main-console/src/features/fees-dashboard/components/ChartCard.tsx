import type { ComponentProps } from "react";
import { ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { VisualCard } from "./VisualCard";
import { HtmlXTickStrip, HtmlYTickStrip } from "./charts/HtmlAxisTicks";
import { cn } from "@/lib/utils";

export const CHART_PLOT_HEIGHT_PX = 220;

export type { ChartConfig };

export { ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };

type ChartCardChildren = ComponentProps<typeof ResponsiveContainer>["children"];

type ChartCardProps = {
  title: string;
  description?: string;
  config: ChartConfig;
  children: ChartCardChildren;
  className?: string;
  chartHeight?: string;
  xAxisTitle: string;
  yAxisTitle: string;
  /** Visible labels under each category (programs, months, hours) */
  xTickLabels: string[];
  /** Visible scale on the left */
  yTickLabels?: string[];
  /** Use smaller X labels when there are many points */
  xTicksCompact?: boolean;
};

/**
 * Fees dashboard chart shell: shadcn ChartContainer + HTML axis tick strips
 * (Recharts axes stay hidden so SVG ticks are never clipped).
 */
export function ChartCard({
  title,
  description,
  config,
  children,
  className,
  chartHeight = "h-[220px]",
  xAxisTitle,
  yAxisTitle,
  xTickLabels,
  yTickLabels = [],
  xTicksCompact,
}: ChartCardProps) {
  const plotHeightClass = chartHeight.startsWith("h-[")
    ? chartHeight
    : `h-[${CHART_PLOT_HEIGHT_PX}px]`;

  return (
    <VisualCard
      title={description ? `${title} · ${description}` : title}
      className={className}
      allowOverflow
    >
      <div className="px-3 pb-3 pt-2">
        <div className="flex min-w-0 items-stretch gap-0">
          <div className="flex w-10 shrink-0 items-center justify-center self-stretch pb-[72px]">
            <span className="origin-center -rotate-90 whitespace-nowrap text-xs font-bold text-[#1a1a1a]">
              {yAxisTitle}
            </span>
          </div>

          {yTickLabels.length > 0 ? (
            <HtmlYTickStrip labels={yTickLabels} plotHeightPx={CHART_PLOT_HEIGHT_PX} />
          ) : null}

          <div className="min-w-0 flex-1">
            <ChartContainer
              config={config}
              className={cn(
                plotHeightClass,
                "w-full min-h-0 !aspect-auto",
                "[&_.recharts-wrapper]:!h-full",
                "[&_.recharts-surface]:overflow-visible",
              )}
              style={{ height: CHART_PLOT_HEIGHT_PX }}
            >
              {children}
            </ChartContainer>

            <HtmlXTickStrip
              labels={xTickLabels}
              compact={xTicksCompact ?? xTickLabels.length > 6}
            />
            <p className="mt-2 text-center text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
              {xAxisTitle}
            </p>
          </div>
        </div>
      </div>
    </VisualCard>
  );
}
