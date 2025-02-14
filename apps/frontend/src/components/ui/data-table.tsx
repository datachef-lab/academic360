import * as React from "react";

// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";

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
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "../globals/DataTablePagination";
import { DataTableToolbar } from "../tables/components/DataTableToolBar";
import { CustomPaginationState } from "../settings/SettingsContent";
import { Skeleton } from "./skeleton";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";

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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  isLoading,
  setPagination,
  searchText,
  setSearchText,
//   setDataLength,
  refetch,
}: DataTableProps<TData, TValue>) {
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
    <div className="space-y-5 my-3">
      <DataTableToolbar table={table} searchText={searchText} setSearchText={setSearchText} refetch={refetch} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(pagination.pageSize)
                .fill(null)
                .map(() =>
                  table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            <Skeleton className="h-[16px] rounded-full" />
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  )),
                )
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
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
