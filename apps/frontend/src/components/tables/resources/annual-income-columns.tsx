import { ColumnDef } from "@tanstack/react-table";
import { AnnualIncome } from "@/types/resources/annual-income";
import ActionEntityMenu from "../../settings/ActionEntityMenu";
import { 
  Landmark,

  Settings2,
  IndianRupee
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const annualIncomeColumns: ColumnDef<AnnualIncome>[] = [
  {
    accessorKey: "range",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Landmark className="h-5 w-5 text-purple-600" />
        <span>Income Range</span>
      </div>
    ),
    cell: ({ row }) => {
      const incomeRange = row.original.range;
      return (
        <div className="flex items-center justify-center">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 drop-shadow-md font-mono border-none"
          >
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold ">{incomeRange}</span>
            </div>
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Settings2 className="h-5 w-5 text-purple-600" />
        <span>Actions</span>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          <ActionEntityMenu type="AnnualIncome" data={row.original} />
        </div>
      );
    },
  },
];