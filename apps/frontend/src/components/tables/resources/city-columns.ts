import { ColumnDef } from "@tanstack/react-table";
import { City } from "@/types/resources/city";

export const cityColumns: ColumnDef<City>[] = [
    {
        accessorKey: "state",
        header: "State",
    },
    {
        accessorKey: "name",
        header: "City",
    },
    {
        accessorKey: "code",
        header: "Code",
    },
    {
        accessorKey: "documentRequired",
        header: "Document Required?",
    },
];