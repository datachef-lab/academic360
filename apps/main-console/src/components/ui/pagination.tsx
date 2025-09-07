import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}: PaginationProps) {
  // Ensure we always show at least 1 page even with no data
  const displayTotalPages = Math.max(1, totalPages);
  const displayCurrentPage = totalItems === 0 ? 1 : currentPage;

  return (
    <div
      className={
        sticky
          ? "sticky bottom-0 z-20 bg-gray-100 border-t border-gray-300 shadow-lg rounded-t-lg"
          : "bg-gray-100 border border-gray-300 rounded-lg shadow-lg"
      }
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            {totalItems === 0
              ? "Showing 0 to 0 of 0 entries"
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} entries`}
          </span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
            <SelectTrigger className="w-20 text-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, displayCurrentPage - 1))}
            disabled={displayCurrentPage === 1 || totalItems === 0}
            className="text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {totalItems === 0 ? (
              <Button
                variant="default"
                size="sm"
                className="w-8 h-8 p-0 text-gray-700 bg-gray-200 border-gray-400"
                disabled
              >
                1
              </Button>
            ) : (
              Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={displayCurrentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 p-0 text-gray-700 ${
                      displayCurrentPage === pageNum ? "bg-gray-200 border-gray-400 hover:bg-gray-300" : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })
            )}
            {displayTotalPages > 5 && totalItems > 0 && (
              <>
                <span className="text-sm text-gray-500">...</span>
                <Button
                  variant={displayCurrentPage === displayTotalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(displayTotalPages)}
                  className={`w-8 h-8 p-0 text-gray-700 ${
                    displayCurrentPage === displayTotalPages ? "bg-gray-200 border-gray-400 hover:bg-gray-300" : ""
                  }`}
                >
                  {displayTotalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(displayTotalPages, displayCurrentPage + 1))}
            disabled={displayCurrentPage === displayTotalPages || totalItems === 0}
            className="text-gray-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
