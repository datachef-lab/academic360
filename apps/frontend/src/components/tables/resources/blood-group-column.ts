import { ColumnDef } from "@tanstack/react-table";
import { BloodGroup } from "@/types/resources/blood-group";

export const bloodGroupColumns: ColumnDef<BloodGroup>[] = [
    {
        accessorKey: "type",
        header: "Type",
    },
];