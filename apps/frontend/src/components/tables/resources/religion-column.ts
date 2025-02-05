import { ColumnDef } from "@tanstack/react-table";
import { Religion } from "@/types/resources/religion";

export const religionColumns: ColumnDef<Religion>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
];