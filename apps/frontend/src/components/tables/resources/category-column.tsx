import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@/types/resources/category";
import ActionEntityMenu from "../../settings/ActionEntityMenu";

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
  {
    accessorKey: "action",
    header: "Action",
    cell:({row})=>{
      return <ActionEntityMenu type="Category" data={row.original} ></ActionEntityMenu>
    }
  },
];
