import { ReactNode } from "react";
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
//
// Styling matches the notification-masters page (see
// `features/notifications/pages/notification-masters-page.tsx`) — same
// `overflow-hidden rounded-md border` shell, same `max-h-[65vh] overflow-auto`
// inner scroll, same subtle right-borders on cells (`[&_th]:border-r` etc.),
// so every library master page reads as the same family without needing the
// notification page's inline utility soup on each call site.
export function LibraryDesktopTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hidden min-w-0 pb-2 lg:block", className)}>
      <div className="overflow-hidden rounded-md border bg-background">
        {/*
          `[&>div]:!overflow-visible` forces the shadcn `<Table>` wrapper
          (which defaults to `overflow-auto` when the caller doesn't pass
          `containerClassName="overflow-visible …"`) to NOT create a nested
          scroll container. Without this, sticky table headers anchor
          against the shadcn wrapper (which has no max-height → nothing to
          scroll → sticky never engages). With it, sticky anchors against
          THIS div's `max-h-[65vh] overflow-auto` — so headers stay fixed
          when the body scrolls.
        */}
        <div className="max-h-[65vh] overflow-auto [&>div]:!overflow-visible [&_table]:w-full [&_table_th]:border-r [&_table_td]:border-r [&_table_th:last-child]:border-r-0 [&_table_td:last-child]:border-r-0">
          {children}
        </div>
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
  // No max-h + overflow-y-auto: the page itself scrolls below `lg`, and
  // pinning a mid-page card list to 70vh creates a nested scroll (page +
  // inner list) that reads as two scrollbars stacked on small screens.
  return <div className={cn("space-y-3 pb-2 lg:hidden", className)}>{children}</div>;
}

// Sticky, light-grey header row. Kept minimal: the shell above sets the shared
// right-borders via `[&_table_th]:border-r`, so per-cell classes only carry
// the sticky positioning + colour. Palette matches the notification-masters
// table exactly (bg-gray-50, tracking-wide uppercase text-gray-500 labels,
// inset bottom border via shadow) so both modules read as one family.
export const STICKY_THEAD_CLASS = "sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-1px_0_#e5e7eb]";

export const STICKY_TH_BASE =
  "h-auto whitespace-nowrap bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500";

// `STICKY_TH_LEFT` no longer pins the column horizontally. Every page uses
// it on the narrow "#" column, but the corresponding body <TableCell>s
// don't carry a matching `sticky left-0` class — so on horizontal scroll
// the row content used to slide UNDER the pinned header, reading as
// overlapping columns. Now it's just a header cell with the # column's
// width; still sticks to the TOP of the shell (inherited from the parent
// `<TableHeader className={STICKY_THEAD_CLASS}>`), which is what actually
// matters for vertical scroll.
//
// Width bumped from `w-10` (40px, only 8px of content room after `px-4`) to
// `w-16` (matches the notification-master table). Any 2- or 3-digit index
// used to overflow into the Name column, showing as visual column overlap
// on pages with >99 rows. Every page that calls this with a redundant
// `w-10` in a `cn(STICKY_TH_LEFT, "w-10")` will still be forced back to 40px
// — those redundant sizes should be dropped (they're leftovers from the
// pre-shared-shell era), but the default is now honest.
export const STICKY_TH_LEFT =
  "h-auto w-16 whitespace-nowrap bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500";

// Same reasoning for right-sticky: after the Actions column removal, no page
// keeps a right-pinned column, and any residual left-over usage would suffer
// the same overlap problem. Kept as a "right-aligned header cell" for pages
// that still put a rightward stat there.
export const STICKY_TH_RIGHT =
  "h-auto min-w-[72px] bg-gray-50 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500";

export const STICKY_TD_LEFT =
  "border-b border-slate-200 sticky left-0 z-10 whitespace-nowrap bg-background px-4 py-3 text-gray-600 shadow-[6px_0_10px_-4px_rgba(15,23,42,0.06)]";

export const STICKY_TD_RIGHT =
  "border-b border-slate-200 sticky right-0 z-10 bg-background px-4 py-3 text-right align-top shadow-[-8px_0_12px_-6px_rgba(15,23,42,0.08)]";

export const TABLE_TD = "border-b border-slate-200 align-top px-4 py-3";

// Utility for body rows — apply on every `<TableRow>` inside the library
// tables so hover-highlight matches the notification-masters aesthetic.
export const TABLE_ROW_HOVER = "border-b last:border-0 hover:bg-gray-50/60";
