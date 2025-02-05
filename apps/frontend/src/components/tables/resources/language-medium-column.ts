import { ColumnDef } from "@tanstack/react-table";
import { LanguageMedium } from "@/types/resources/language-medium";

export const languageMediumColumns: ColumnDef<LanguageMedium>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
];