import React, { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LibraryTablePageProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  actions?: ReactNode;
  search?: {
    value: string;
    onChange: (_next: string) => void;
    placeholder?: string;
  };
  toolbar?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (_next: number) => void;
  };
  children: ReactNode;
};

export function LibraryTablePage({
  title,
  subtitle,
  icon: Icon,
  actions,
  search,
  toolbar,
  loading,
  empty,
  emptyMessage = "No records found.",
  pagination,
  children,
}: LibraryTablePageProps) {
  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Icon className="mr-2 h-8 w-8 rounded-md border p-1" />
                {title}
              </CardTitle>
              {subtitle ? (
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          {search || toolbar ? (
            <div className="mb-3 border-b bg-background px-2 py-3 sm:px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {search ? (
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder={search.placeholder ?? "Search…"}
                      value={search.value}
                      onChange={(e) => search.onChange(e.target.value)}
                    />
                  </div>
                ) : (
                  <span />
                )}
                {toolbar ? (
                  <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            className="relative min-w-0 px-2 sm:px-4"
            style={{ minHeight: loading || empty ? "320px" : undefined }}
          >
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : empty ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              children
            )}
          </div>

          {pagination && pagination.total > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-sm text-slate-600 sm:px-4">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper for the desktop table block. Render a `<Table>` inside this; pass
// `containerClassName="overflow-visible min-w-[900px]"` on that Table so the inner scroll
// shell here owns scrolling and the table itself just provides the min-width canvas.
export function LibraryDesktopTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hidden min-w-0 pb-2 lg:block", className)}>
      <div className="max-h-[min(70vh,640px)] overflow-auto rounded-md border bg-background">
        {children}
      </div>
    </div>
  );
}

export function LibraryMobileCardsShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-h-[70vh] space-y-3 overflow-y-auto pb-2 lg:hidden", className)}>
      {children}
    </div>
  );
}

// Sticky, colored thead. Pass through any child <TableRow> / <TableHead>.
// Use <LibraryTableHead sticky="left|right"> for first/last frozen columns.
export const STICKY_THEAD_CLASS =
  "sticky top-0 z-20 border-b-2 border-slate-500 bg-muted/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/80 dark:border-slate-400";

export const STICKY_TH_BASE =
  "h-auto whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400";

export const STICKY_TH_LEFT =
  "sticky left-0 z-30 h-auto w-10 whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400";

export const STICKY_TH_RIGHT =
  "sticky right-0 z-30 h-auto min-w-[72px] border-solid border-l-slate-300 border-r border-r-slate-300 bg-muted/95 px-3 py-2.5 text-right text-xs font-semibold text-slate-800 backdrop-blur shadow-[-8px_0_12px_-6px_rgba(15,23,42,0.12)] dark:border-l-slate-400 dark:border-r-slate-300";

export const STICKY_TD_LEFT =
  "border-b border-slate-200 sticky left-0 z-10 whitespace-nowrap bg-background px-2 text-muted-foreground shadow-[6px_0_10px_-4px_rgba(15,23,42,0.06)]";

export const STICKY_TD_RIGHT =
  "border-b border-slate-200 sticky right-0 z-10 bg-background px-2 text-right align-top shadow-[-8px_0_12px_-6px_rgba(15,23,42,0.08)]";

export const TABLE_TD = "border-b border-slate-200 align-top px-2";
