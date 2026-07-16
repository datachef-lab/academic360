import React from "react";
import type { LucideIcon } from "lucide-react";

export type LibraryPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

// Canonical page header used by every library page (table, dashboard, split-view,
// archive, search, …). The card itself is just a bordered rounded box so it composes
// inside any outer wrapper — pair it with `<div className="min-w-0 p-2 sm:p-4">` or
// `<div className="p-4 sm:p-6">` depending on whether the page renders a Card body.
export function LibraryPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: LibraryPageHeaderProps) {
  return (
    <div className="mb-3 rounded-md border bg-background p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center text-lg font-semibold sm:text-xl">
            <Icon className="mr-2 h-8 w-8 rounded-md border p-1" />
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
