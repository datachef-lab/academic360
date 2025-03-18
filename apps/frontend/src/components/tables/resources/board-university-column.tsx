import { ColumnDef } from "@tanstack/react-table";
import { BoardUniversity } from "@/types/resources/board-university";
import ActionEntityMenu from "../../settings/ActionEntityMenu";

export const boardUniversityColumns: ColumnDef<BoardUniversity>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "code",
        header: "Code",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
    {
        accessorKey: "degree",
        header: "Degree",
    },

    {
        accessorKey:"actions",
        header:"Actions",
        cell:({row})=>{
            return <ActionEntityMenu type="BoardUniversity" data={row.original} />
        }
    }
];