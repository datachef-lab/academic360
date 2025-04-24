import { ColumnDef } from "@tanstack/react-table";
import { Religion } from "@/types/resources/religion";
import ActionEntityMenu from "../../settings/ActionEntityMenu";

export const religionColumns: ColumnDef<Religion>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
    {
        accessorKey: "action",
        header: "Action",
        cell:({row})=>{
          return <ActionEntityMenu type="Religion" data={row.original} ></ActionEntityMenu>;
        }
      },
];