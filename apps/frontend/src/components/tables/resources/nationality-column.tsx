import { ColumnDef } from "@tanstack/react-table";
import { Nationality } from "@/types/resources/nationality";
import { NationalityActions } from "../Actions/NationalityActions";
import { 
  Globe,
  Hash,
  ListOrdered,
  Settings2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const nationalityColumns: ColumnDef<Nationality>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start gap-2 text-slate-800 font-semibold">
        <Globe className="h-5 w-5 text-purple-600" />
        <span>Nationality</span>
      </div>
    ),
    cell: ({ row }) => {
      const nationalityName = row.original.name;
      return (
        <div className="flex items-center justify-start">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 drop-shadow-md border-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{nationalityName}</span>
            </div>
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <Hash className="h-5 w-5 text-purple-600" />
        <span>Code</span>
      </div>
    ),
    cell: ({ row }) => {
      const code = row.original.code;
      return code ? (
        <Badge 
          variant="outline" 
          className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-600 drop-shadow-md border-none font-mono"
        >
          {code}
        </Badge>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
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
      return sequence ? (
        <Badge 
          variant="outline" 
          className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-600 drop-shadow-md border-none font-mono"
        >
          {sequence}
        </Badge>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
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
          <NationalityActions nationality={row.original} />
        </div>
      );
    },
  },
];