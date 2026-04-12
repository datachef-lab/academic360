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
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
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

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-lg border border-border bg-muted/30 text-foreground shadow-sm",
        sticky &&
          "sticky bottom-0 z-20 rounded-t-lg border-t-2 border-primary/20 bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap tabular-nums">
            {totalItems === 0
              ? "No entries"
              : `Showing ${startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems}`}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[4.5rem] shrink-0 bg-background font-medium tabular-nums">
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
            <span className="text-muted-foreground">per page</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 md:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1 px-3"
            onClick={() => onPageChange(Math.max(1, displayCurrentPage - 1))}
            disabled={displayCurrentPage === 1 || totalItems === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <div className="flex max-w-full flex-wrap items-center justify-center gap-1 px-1">
            {totalItems === 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 min-w-9 px-0"
                disabled
              >
                1
              </Button>
            ) : (
              pageItems.map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`e-${idx}`}
                    className="inline-flex min-w-7 items-center justify-center text-sm text-muted-foreground"
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
                      "h-9 min-w-9 px-0 font-semibold tabular-nums",
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
            className="h-9 gap-1 px-3"
            onClick={() => onPageChange(Math.min(displayTotalPages, displayCurrentPage + 1))}
            disabled={displayCurrentPage === displayTotalPages || totalItems === 0}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
