
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./Pagination";
import { Skeleton } from "../ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  pagination: { pageIndex: number; pageSize: number };
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  isLoading = false,
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
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
  });
  const skeletonRows = useMemo(
    () => Array(pagination.pageSize).fill(null),
    [pagination.pageSize]
  );

  return (
    <div className=" p-4 space-y-4">


      <div className="rounded-xl  drop-shadow-md overflow-x-hidden ">
      <Table className="border-separate  border-spacing-y-4 w-full">
              <TableHeader >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gray-50 whitespace-nowrap hover:bg-gray-50  ">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="py-6 px-4 first:pl-9 text-center   font-semibold text-base"
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  skeletonRows.map((_, index) => (
                    <TableRow key={index} className="bg-gray-50 rounded-lg">
                      {columns.map((_, colIndex) => (
                        <TableCell 
                          key={colIndex} 
                          className="px-4 py-3  first:rounded-l-lg last:rounded-r-lg"
                        >
                          <Skeleton className="h-4 w-full rounded-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow 
                      key={row.id} 
                       className="  my-24 drop-shadow-sm  bg-gray-100 whitespace-nowrap  rounded-full hover:bg-gray-100 "
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          className="px-4 py-3 first:pl-10  text-center first:rounded-l-lg last:rounded-r-lg"
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
              </TableBody>
            </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}