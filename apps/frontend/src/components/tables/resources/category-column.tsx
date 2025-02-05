import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@/types/resources/category";

export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "documentRequired",
    header: "Document Required?",
    cell: ({ row }) => {
      if (row.getValue("documentRequired")) {
        return <span>Yes</span>;
      }
      return <span>No</span>;
    },
  },
];
