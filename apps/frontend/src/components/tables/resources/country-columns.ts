import { ColumnDef } from "@tanstack/react-table";
import { Country } from "@/types/resources/country";

export const countryColumns: ColumnDef<Country>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
];