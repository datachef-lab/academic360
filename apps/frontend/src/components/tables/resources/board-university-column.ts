import { ColumnDef } from "@tanstack/react-table";
import { BoardUniversity } from "@/types/resources/board-university";

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
];