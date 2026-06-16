import { ReactNode } from "react";
import { VisualCard } from "./VisualCard";

type CompactPanelProps = {
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  noPadding?: boolean;
};

export function CompactPanel({
  title,
  children,
  headerRight,
  className,
  noPadding,
}: CompactPanelProps) {
  return (
    <VisualCard title={title} headerRight={headerRight} className={className} noPadding>
      {noPadding ? (
        <div className="p-3">
          <div className="overflow-hidden rounded-md border border-[#a0a0a0] bg-white">
            {children}
          </div>
        </div>
      ) : (
        <div className="p-3">{children}</div>
      )}
    </VisualCard>
  );
}
