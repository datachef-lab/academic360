import { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/components/tables/users/ActionMenu";
import { User } from "@/types/user/user";
import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";

export const userColumns: ColumnDef<User>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "whatsappNumber",
    header: "WhatsApp No.",
  },
  {
    header: "Actions",
    cell: ({ row }) => {
      return <ActionMenu user={row.original} />},
     
    },
 
];
