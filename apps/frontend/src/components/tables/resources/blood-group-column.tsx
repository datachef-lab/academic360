import { ColumnDef } from "@tanstack/react-table";
import { BloodGroup } from "@/types/resources/blood-group";
import { BloodGroupActions } from "../Actions/BloodGroupActions";

export const bloodGroupColumns: ColumnDef<BloodGroup>[] = [
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <BloodGroupActions bloodGroup={row.original} />, // Use the new component
  },
];




