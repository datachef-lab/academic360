import { ColumnDef } from "@tanstack/react-table";
import { Nationality } from "@/types/resources/nationality";

export const nationalityColumns: ColumnDef<Nationality>[] = [
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
];