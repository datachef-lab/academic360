import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Table,  TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "../ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  pagination: { pageIndex: number; pageSize: number };
  isLoading?: boolean;
  onViewStudent?: (studentId: number) => void;
}

export function DataTableStudent<TData, TValue>({
  isLoading = false,
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onViewStudent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    meta: {
      onViewStudent,
    },
  });

  const skeletonRows = useMemo(
    () => Array(pagination.pageSize).fill(null),
    [pagination.pageSize]
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-hidden">
        <Table className="border-separate mt-2 border-spacing-y-2 w-full">
          {isLoading ? (
            skeletonRows.map((_, index) => (
              <TableRow key={index} className="bg-gray-50/5 hover:bg-white/5 backdrop-blur-sm">
                {columns.map((_, colIndex) => (
                  <TableCell 
                    key={colIndex} 
                    className={`px-4 py-3 text-center ${colIndex === 0 ? 'pl-10' : ''}`}
                  >
                    <Skeleton className="h-4 w-[80%] mx-auto rounded-full bg-gray-200/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="hover:bg-white/10 bg-transparent"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    className="px-4 py-3 first:pl-10 text-center"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </Table>
      </div>
    </div>
  );
}