import { ColumnDef } from "@tanstack/react-table";
import { Occupation } from "@/types/resources/occupation";
import { OccupationActions } from "../Actions/OccupationActions";
import { Briefcase, Settings2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const occupationColumns: ColumnDef<Occupation>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Briefcase className="h-5 w-5 text-purple-600" />
        <span>Occupation</span>
      </div>
    ),
    cell: ({ row }) => {
      const occupationName = row.original.name;
      return (
        <div className="flex items-center justify-center">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 drop-shadow-md border-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{occupationName}</span>
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
          <OccupationActions occupation={row.original} />
        </div>
      );
    },
  },
];