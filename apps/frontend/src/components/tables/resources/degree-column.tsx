import { ColumnDef } from "@tanstack/react-table";
import { Degree } from "@/types/resources/degree";
import ActionEntityMenu from "../../settings/ActionEntityMenu";

export const degreeColumns: ColumnDef<Degree>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
    {
        header:"Action",
        cell:({ row })=>{
            return <ActionEntityMenu type="Degree" data={row.original}/>
        }
    },
];