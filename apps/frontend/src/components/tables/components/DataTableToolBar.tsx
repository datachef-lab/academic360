import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import React, { useCallback, useRef } from "react";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Plus, TrashIcon } from "lucide-react";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { debounce } from "lodash";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData[] | undefined, Error>>;
}

export function DataTableToolbar<TData>({
  table,
  searchText,
  setSearchText,
  refetch,
}: DataTableToolbarProps<TData>) {
  // Create a ref to store the debounced function
  const debouncedFn = useRef<ReturnType<typeof debounce>>();
  
  // Create a memoized search function using useCallback
  const debouncedSearch = useCallback((query: string) => {
    // If there's no existing debounced function or dependencies changed, create a new one
    if (!debouncedFn.current) {
      debouncedFn.current = debounce((value: string) => {
        table.setGlobalFilter(value);
        refetch(); // Trigger the API call manually
      }, 500);
    }
    
    // Call the debounced function with the current query
    debouncedFn.current(query);
  }, [table, refetch]);

  // Handle input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  return (
    <div className="flex flex-wrap items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Account"
            options={[
              { label: "Admin", value: "ADMIN" },
              { label: "Student", value: "STUDENT" },
            ]}
          />
        )}
        {searchText.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchText("");
              table.setGlobalFilter(""); // Reset the global filter explicitly
              table.resetColumnFilters();
              table.resetGlobalFilter(); // Ensure the table resets its global state
              refetch(); // Also refetch to reset results
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <Button variant="outline" size="sm">
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        ) : null}
        <DataTableViewOptions table={table} />
        <Button
          size="sm"
          variant="ghost"
          className="border"
          onClick={() => console.log("Open modal for creating a user!")}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
