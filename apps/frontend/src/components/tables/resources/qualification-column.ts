import { ColumnDef } from "@tanstack/react-table";
import { Qualification } from "@/types/resources/qualification";

export const qualificationColumns: ColumnDef<Qualification>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "sequence",
        header: "Degree",
    },
];