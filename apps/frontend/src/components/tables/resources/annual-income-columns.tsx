import { ColumnDef } from "@tanstack/react-table";
import { AnnualIncome } from "@/types/resources/annual-income";
import ActionEntityMenu from "../../settings/ActionEntityMenu";

export const annualIncomeColumns: ColumnDef<AnnualIncome>[] = [
    {
        accessorKey: "range",
        header: "Range",
    },
    {
        accessorKey: "action",
        header: "Action",
        cell:({row})=>{
            return <ActionEntityMenu type="AnnualIncome" data={row.original} />
        }
    },
];