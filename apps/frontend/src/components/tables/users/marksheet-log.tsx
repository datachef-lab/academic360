import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { MarksheetLog } from "@/types/academics/marksheet";
import { ColumnDef } from "@tanstack/react-table";

export const marksheetLogsColumns: ColumnDef<MarksheetLog>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "item",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Item" />;
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Created At" />;
    },
    cell: ({ row }) => {
      const formattedDate = new Date(row.original.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // Enables 12-hour format with AM/PM
      });
      return <p>{formattedDate}</p>;
    },
  },
  {
    accessorKey: "createdByUser",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="By" />;
    },
    cell: ({ row }) => <p>{row.original.createdByUser.name}</p>,
  },
];
