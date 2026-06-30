import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  sticky?: boolean;
  /** Merged onto the outer wrapper (e.g. theme tokens for a specific page). */
  className?: string;
}

/** Page numbers to show with ellipses for large page counts. */
function getPageNumbers(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 1) return last === 1 ? [1] : [];
  if (last <= 9) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const delta = 2;
  const set = new Set<number>();
  set.add(1);
  set.add(last);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= last) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const prev = sorted[i - 1];
    if (i > 0 && prev !== undefined && cur - prev > 1) out.push("ellipsis");
    out.push(cur);
  }
  return out;
}

function PageNavButtons({
  displayCurrentPage,
  displayTotalPages,
  totalItems,
  pageItems,
  onPageChange,
  className,
}: {
  displayCurrentPage: number;
  displayTotalPages: number;
  totalItems: number;
  pageItems: (number | "ellipsis")[];
  onPageChange: (page: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1 px-2 sm:h-9 sm:px-3"
        onClick={() => onPageChange(Math.max(1, displayCurrentPage - 1))}
        disabled={displayCurrentPage === 1 || totalItems === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </Button>

      <div className="flex max-w-full items-center justify-center gap-1">
        {totalItems === 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 min-w-8 px-0 sm:h-9 sm:min-w-9"
            disabled
          >
            1
          </Button>
        ) : (
          pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="inline-flex min-w-6 items-center justify-center text-sm text-muted-foreground sm:min-w-7"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={displayCurrentPage === item ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 min-w-8 px-0 text-sm font-semibold tabular-nums sm:h-9 sm:min-w-9",
                  displayCurrentPage === item && "pointer-events-none shadow-sm",
                )}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1 px-2 sm:h-9 sm:px-3"
        onClick={() => onPageChange(Math.min(displayTotalPages, displayCurrentPage + 1))}
        disabled={displayCurrentPage === displayTotalPages || totalItems === 0}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  sticky = false,
  className,
}: PaginationProps) {
  const displayTotalPages = Math.max(1, totalPages);
  const displayCurrentPage = totalItems === 0 ? 1 : currentPage;
  const pageItems = totalItems === 0 ? [] : getPageNumbers(displayCurrentPage, displayTotalPages);
  const rangeEnd = Math.min(endIndex, totalItems);

  const countLabel =
    totalItems === 0 ? (
      "No entries"
    ) : (
      <>
        <span className="sm:hidden">
          {startIndex + 1}–{rangeEnd} / {totalItems}
        </span>
        <span className="hidden sm:inline">
          Showing {startIndex + 1}–{rangeEnd} of {totalItems}
        </span>
      </>
    );

  const perPageControl = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden text-xs sm:inline sm:text-sm">Rows</span>
      <Select
        value={itemsPerPage.toString()}
        onValueChange={(value) => onItemsPerPageChange(Number(value))}
      >
        <SelectTrigger className="h-8 w-[4.25rem] shrink-0 bg-background text-sm font-medium tabular-nums sm:h-9 sm:w-[4.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-xs sm:text-sm">per page</span>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-lg border border-border bg-muted/30 text-foreground shadow-sm",
        sticky &&
          "sticky bottom-0 z-20 rounded-t-lg border-t-2 border-primary/20 bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-2.5 p-3 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 text-sm tabular-nums text-muted-foreground">{countLabel}</span>
          <PageNavButtons
            displayCurrentPage={displayCurrentPage}
            displayTotalPages={displayTotalPages}
            totalItems={totalItems}
            pageItems={pageItems}
            onPageChange={onPageChange}
          />
        </div>
        <div className="flex items-center justify-start">{perPageControl}</div>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-center justify-between gap-4 p-4 sm:flex lg:flex-nowrap">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground lg:flex-nowrap">
          <span className="shrink-0 whitespace-nowrap tabular-nums">{countLabel}</span>
          <div className="shrink-0">{perPageControl}</div>
        </div>

        <PageNavButtons
          displayCurrentPage={displayCurrentPage}
          displayTotalPages={displayTotalPages}
          totalItems={totalItems}
          pageItems={pageItems}
          onPageChange={onPageChange}
          className="justify-end"
        />
      </div>
    </div>
  );
}
