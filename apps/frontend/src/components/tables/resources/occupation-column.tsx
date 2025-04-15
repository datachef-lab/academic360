import { ColumnDef } from "@tanstack/react-table";
import { Occupation } from "@/types/resources/occupation";
import { OccupationActions } from "../Actions/OccupationActions";

export const occupationColumns: ColumnDef<Occupation>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <OccupationActions occupation={row.original} />,
  },
];



