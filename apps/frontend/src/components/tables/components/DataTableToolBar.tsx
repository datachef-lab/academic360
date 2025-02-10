import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
// import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
// import { CalendarDatePicker } from "./CalenderDatePicker";
import React from "react";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Plus, TrashIcon } from "lucide-react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

// export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
//   const isFiltered = table.getState().columnFilters.length > 0;

//   const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
//     from: new Date(new Date().getFullYear(), 0, 1),
//     to: new Date(),
//   });

//   const handleDateSelect = ({ from, to }: { from: Date; to: Date }) => {
//     setDateRange({ from, to });
//     // Filter table data based on selected date range
//     table.getColumn("date")?.setFilterValue([from, to]);
//   };

//   return (
//     <div className="flex flex-wrap items-center justify-between">
//       <div className="flex flex-1 flex-wrap items-center gap-2">
//         <Input
//           placeholder="Filter emails..."
//           value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
//           onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
//           className="max-w-sm"
//         />
//         {/* {table.getColumn("category") && (
//           <DataTableFacetedFilter column={table.getColumn("category")} title="Category" options={categories} />
//         )}
//         {table.getColumn("type") && (
//           <DataTableFacetedFilter column={table.getColumn("type")} title="Type" options={incomeType} />
//         )} */}
//         {isFiltered && (
//           <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
//             Reset
//             <Cross2Icon className="ml-2 h-4 w-4" />
//           </Button>
//         )}
//         <CalendarDatePicker
//           date={dateRange}
//           onDateSelect={handleDateSelect}
//           className="h-9 w-[250px]"
//           variant="outline"
//         />
//       </div>

//       <div className="flex items-center gap-2">
//         {table.getFilteredSelectedRowModel().rows.length > 0 ? (
//           <Button variant="outline" size="sm">
//             <TrashIcon className="mr-2 size-4" aria-hidden="true" />
//             Delete ({table.getFilteredSelectedRowModel().rows.length})
//           </Button>
//         ) : null}
//         <DataTableViewOptions table={table} />
//       </div>
//     </div>
//   );
// }

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
//   const isFiltered = table.getState().columnFilters.length > 0;
  const [globalFilter, setGlobalFilter] = React.useState("");

  return (
    <div className="flex flex-wrap items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(event) => {
            setGlobalFilter(event.target.value);
            table.setGlobalFilter(event.target.value);
          }}
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
        {globalFilter.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setGlobalFilter("");
              table.setGlobalFilter(""); // Reset the global filter explicitly
              table.resetColumnFilters();
              table.resetGlobalFilter(); // Ensure the table resets its global state
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
