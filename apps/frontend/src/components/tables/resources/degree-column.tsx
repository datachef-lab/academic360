import { ColumnDef } from "@tanstack/react-table";
import { Degree } from "@/types/resources/degree";
import ActionEntityMenu from "../../settings/ActionEntityMenu";
import { 
  GraduationCap,
  ListOrdered,
  Settings2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const degreeColumns: ColumnDef<Degree>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <GraduationCap className="h-5 w-5 text-purple-600" />
        <span>Degree</span>
      </div>
    ),
    cell: ({ row }) => {
      const degreeName = row.original.name;
      return (
        <div className="flex items-center justify-center">
          <div className="ml-2">
            <div className="text-sm font-semibold text-gray-800">{degreeName}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sequence",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <ListOrdered className="h-5 w-5 text-purple-600" />
        <span>Sequence</span>
      </div>
    ),
    cell: ({ row }) => {
      const sequence = row.original.sequence;
      if (!sequence) return null;
      return (
        <Badge 
          variant="outline" 
          className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-600 drop-shadow-md border-none font-mono"
        >
          {sequence}
        </Badge>
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
          <ActionEntityMenu type="Degree" data={row.original} />
        </div>
      );
    },
  },
];