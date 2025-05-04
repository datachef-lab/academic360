import { ColumnDef } from "@tanstack/react-table";
import { BloodGroup } from "@/types/resources/blood-group";
import { BloodGroupActions } from "../Actions/BloodGroupActions";
import { Droplet, HeartPulse, Settings2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const bloodGroupColumns: ColumnDef<BloodGroup>[] = [
  {
    accessorKey: "type",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Droplet className="h-5 w-5 text-purple-600" />
        <span>Blood Type</span>
      </div>
    ),
    cell: ({ row }) => {
      const bloodType = row.original.type;
      return (
        <div className="flex items-center justify-center">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 drop-shadow-md font-mono border-none"
          >
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-rose-600" />
              <span className="font-bold">{bloodType}</span>
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
          <BloodGroupActions bloodGroup={row.original} />
        </div>
      );
    },
  },
];