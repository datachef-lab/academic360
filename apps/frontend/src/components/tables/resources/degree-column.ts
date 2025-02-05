import { ColumnDef } from "@tanstack/react-table";
import { Degree } from "@/types/resources/degree";

export const degreeColumns: ColumnDef<Degree>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
];