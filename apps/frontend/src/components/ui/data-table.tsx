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
    <div className="space-y-3 p-1  rounded-2xl my-3">
        <div className="px-6 py-1   rounded-lg ">
        <DataTableToolbar  table={table} searchText={searchText} setSearchText={setSearchText} refetch={refetch} />
        </div>
          <div className=" p-2  overflow-hidden">
            <Table className="border-separate px-2 border-spacing-y-3 w-full">
              <TableHeader >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gray-50  ">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="py-3 px-3 first:pl-9 text-center  font-semibold text-base"
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
                       className="  my-24 drop-shadow-md  bg-gray-100 hover:scale-95 rounded-full hover:bg-gray-100 transition-all duration-200 ease-in-out"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          className="px-4 py-3 first:pl-10  text-center first:rounded-l-full last:rounded-r-full"
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
          <div className="my-3">
            <DataTablePagination table={table} />
          </div>
        </div>
  );
}
