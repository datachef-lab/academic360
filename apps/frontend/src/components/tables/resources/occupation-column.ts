import { ColumnDef } from "@tanstack/react-table";
import { Occupation } from "@/types/resources/occupation";

export const occupationColumns: ColumnDef<Occupation>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
];