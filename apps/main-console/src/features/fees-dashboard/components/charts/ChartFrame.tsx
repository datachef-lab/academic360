import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartFrameProps = {
  xLabel: string;
  yLabel: string;
  heightClass?: string;
  children: ReactNode;
  className?: string;
};

/** Renders visible HTML axis titles so labels are never clipped by the chart card. */
export function ChartFrame({
  xLabel,
  yLabel,
  heightClass = "h-[220px]",
  children,
  className,
}: ChartFrameProps) {
  return (
    <div className={cn("flex min-w-0 gap-0", className)}>
      <div
        className="flex w-11 shrink-0 items-center justify-center self-stretch pb-10"
        aria-hidden
      >
        <span className="block max-h-[140px] origin-center -rotate-90 whitespace-nowrap text-center text-xs font-semibold leading-none text-[#1a1a1a]">
          {yLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            heightClass,
            "w-full min-h-[200px] overflow-visible [&_svg]:overflow-visible",
          )}
        >
          {children}
        </div>
        <p className="mt-2 text-center text-xs font-semibold text-[#1a1a1a]">{xLabel}</p>
      </div>
    </div>
  );
}
