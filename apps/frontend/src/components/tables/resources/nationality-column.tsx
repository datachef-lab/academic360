import { ColumnDef } from "@tanstack/react-table";
import { Nationality } from "@/types/resources/nationality";
import { NationalityActions } from "../Actions/NationalityActions";


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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <NationalityActions nationality={row.original} />,
  },
];



