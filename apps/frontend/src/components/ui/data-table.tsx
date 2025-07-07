import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "../globals/DataTablePagination";
import { DataTableToolbar } from "../tables/components/DataTableToolBar";
import { CustomPaginationState } from "../settings/SettingsContent";
import { Skeleton } from "./skeleton";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useLocation } from "react-router-dom";

export interface DataTableProps<TData, TValue> extends Omit<PaginationState, "pageIndex" | "pageSize"> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: CustomPaginationState;
  isLoading: boolean;
  setPagination: React.Dispatch<React.SetStateAction<CustomPaginationState>>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  setDataLength: React.Dispatch<React.SetStateAction<number>>;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData[] | undefined, Error>>;
  onRowClick?: (row: Row<TData>) => void;
  viewDataToolbar?: boolean;
  optionalTools?: React.ReactNode,
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  isLoading,
  setPagination,
  searchText,
  setSearchText,
  viewDataToolbar = true,
  optionalTools,

//   setDataLength,
  refetch,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const location = useLocation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: pagination.totalElements, // Total records
    pageCount: pagination.totalPages,
    onPaginationChange: (updaterOrValue) => {
      setPagination((prev) => {
        const newState = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        console.log("Setting new state:", newState);
        return {
          ...prev,
          pageIndex: newState.pageIndex,
          pageSize: newState.pageSize,
        };
      });
    },
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }, // Pagination state
    },
  });

  //   React.useEffect(() => {
  //     setDataLength(table.getRowModel().rows.length);
  //   }, [table.getRowModel().rows.length]);

  return (
    <div className="space-y-3">
        <div>
        {location.pathname !== '/home/downloads' && viewDataToolbar &&  (<>
        <DataTableToolbar  table={table} searchText={searchText} setSearchText={setSearchText} refetch={refetch} />
        {optionalTools}
        </>)}
        </div>
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-4 py-2 text-left font-semibold text-gray-700"
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
                  Array(pagination.pageSize).fill(null).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, colIndex) => (
                        <TableCell
                          key={colIndex}
                          className="px-4 py-2"
                        >
                          <Skeleton className="h-8 w-full rounded-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted cursor-pointer"
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-2 text-left"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <SearchX className="h-5 w-5 text-red-600" />
                      <span>No data available</span>
                    </div>
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="my-3">
            <DataTablePagination table={table} />
          </div>
        </div>
  );
}
