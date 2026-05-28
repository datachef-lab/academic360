import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VisualCardProps = {
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  noPadding?: boolean;
  /** Allow chart axis captions to render outside the plot (charts only). */
  allowOverflow?: boolean;
};

export function VisualCard({
  title,
  children,
  headerRight,
  className,
  noPadding,
  allowOverflow,
}: VisualCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#d4d4d4] bg-white shadow-sm",
        allowOverflow ? "overflow-visible" : "overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#ebebeb] bg-[#fafafa] px-3 py-2">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
        {headerRight}
      </div>
      <div className={cn(!noPadding && "p-3", noPadding)}>{children}</div>
    </section>
  );
}
