import { cn } from "@/lib/utils";

/** Always-visible X tick labels (HTML), aligned under each category */
export function HtmlXTickStrip({
  labels,
  className,
  compact,
}: {
  labels: string[];
  className?: string;
  /** Slightly smaller type when many categories */
  compact?: boolean;
}) {
  if (!labels.length) return null;

  return (
    <div
      className={cn(
        "mt-2 grid w-full gap-0 border-t-2 border-[#a0a0a0] bg-[#fafafa] px-0.5 py-2",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
      role="list"
      aria-label="Chart categories"
    >
      {labels.map((label, i) => (
        <span
          key={`${label}-${i}`}
          role="listitem"
          className={cn(
            "block px-0.5 text-center font-semibold leading-tight text-[#1a1a1a]",
            compact ? "text-[9px]" : "text-[11px]",
          )}
          title={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/** Always-visible Y tick labels (HTML) on the left; height should match plot area */
export function HtmlYTickStrip({
  labels,
  plotHeightPx,
  className,
}: {
  labels: string[];
  plotHeightPx: number;
  className?: string;
}) {
  if (!labels.length) return null;

  const ordered = [...labels].reverse();

  return (
    <div
      className={cn(
        "flex w-12 shrink-0 flex-col justify-between border-r border-[#d4d4d4] py-2 pr-1.5 text-right text-[11px] font-semibold tabular-nums text-[#1a1a1a]",
        className,
      )}
      style={{ height: plotHeightPx }}
      aria-hidden
    >
      {ordered.map((label, i) => (
        <span key={`${label}-${i}`}>{label}</span>
      ))}
    </div>
  );
}
