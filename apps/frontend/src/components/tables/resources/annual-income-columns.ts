import { ColumnDef } from "@tanstack/react-table";
import { AnnualIncome } from "@/types/resources/annual-income";

export const annualIncomeColumns: ColumnDef<AnnualIncome>[] = [
    {
        accessorKey: "range",
        header: "Range",
    },
];