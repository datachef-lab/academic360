import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Search } from "lucide-react";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { debounce } from "lodash";
import React, { useCallback, useRef } from "react";


interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData[] | undefined, Error>>;
}

export function DataTableToolbar<TData>({ table, searchText, setSearchText, refetch }: DataTableToolbarProps<TData>) {
  const debouncedFn = useRef<ReturnType<typeof debounce>>();
  // const location = useLocation();

  const debouncedSearch = useCallback(
    (query: string) => {
      if (!debouncedFn.current) {
        debouncedFn.current = debounce((value: string) => {
          table.setGlobalFilter(value);
          refetch();
        }, 500);
      }
      debouncedFn.current(query);
    },
    [table, refetch],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-center   rounded-md ">
      {/* Result on the left */}
      {/* <div className="flex border items-center gap-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <Button variant="outline" size="sm">
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        ) : null}

        <div className="text-base font-medium text-gray-900">
          {table.getFilteredSelectedRowModel().rows.length > 0
            ? `${table.getFilteredSelectedRowModel().rows.length} selected`
            : table.getFilteredRowModel().rows.length > 0
            ? `${table.getFilteredRowModel().rows.length} people in total`
            : "No results"}
        </div>
      </div> */}

      {/* Filters on the right */}
<div className="flex item-center w-full  justify-end"></div>
        <div className="flex flex-row items-center   justify-end gap-4">
          <DataTableViewOptions table={table} />
          <div className="relative max-w-xs   w-full">
            <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={handleSearchChange}
              className="pl-10 border drop-shadow-md rounded-md focus:ring-0 focus:ring-offset-0"
            />
          </div>

          {/* Type filter removed to prevent column errors */}
          {searchText.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchText("");
                table.setGlobalFilter("");
                table.resetColumnFilters();
                table.resetGlobalFilter();
                refetch();
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
    </div>
  );
}
