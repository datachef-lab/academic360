import { ColumnDef } from "@tanstack/react-table";
import { Document } from "@/types/resources/document";

export const documentColumns: ColumnDef<Document>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "description",
        header: "Degree",
    },
];