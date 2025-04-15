import { ColumnDef } from "@tanstack/react-table";
import { LanguageMedium } from "@/types/resources/language-medium";
import { LanguageMediumActions } from "../Actions/LanguageMediumActions";

export const languageMediumColumns: ColumnDef<LanguageMedium>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <LanguageMediumActions languageMedium={row.original} />, 
  },
];



