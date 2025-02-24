import { User } from "@/types/user/user";
import { ColumnDef } from "@tanstack/react-table";

export interface ManageMarksheetType {
  item: string;
  source: string;
  file: string | null;
  createdbyUser: User;
  createdDate: Date;
}

export const manageMarksheetColumns: ColumnDef<ManageMarksheetType>[] = [
  {
    accessorKey: "item",
    header: "Item",
  },
  {
    accessorKey: "createdbyUser",
    header: "By User",
    cell: ({ row }) => {
      const obj = row.original;

      return <p>{obj.createdbyUser.name}</p>;
    },
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "createdDate",
    header: "Created At",
  },
];
