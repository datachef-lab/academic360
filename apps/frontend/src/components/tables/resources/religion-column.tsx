// import { ColumnDef } from "@tanstack/react-table";
// import { Religion } from "@/types/resources/religion";
// import ActionEntityMenu from "../../settings/ActionEntityMenu";

// export const religionColumns: ColumnDef<Religion>[] = [
//     {
//         accessorKey: "name",
//         header: "Name",
//     },
//     {
//         accessorKey: "sequence",
//         header: "Sequence",
//     },
//     {
//         accessorKey: "action",
//         header: "Action",
//         cell:({row})=>{
//           return <ActionEntityMenu type="Religion" data={row.original} ></ActionEntityMenu>;
//         }
//       },
// ];

import { ColumnDef } from "@tanstack/react-table";
import { Religion } from "@/types/resources/religion";
import ActionEntityMenu from "../../settings/ActionEntityMenu";
import { 
  BookHeart,
  ListOrdered,
  Settings2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const religionColumns: ColumnDef<Religion>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start gap-2 text-slate-800 font-semibold">
        <BookHeart className="h-5 w-5 text-purple-600" />
        <span>Religion</span>
      </div>
    ),
    cell: ({ row }) => {
      const religionName = row.original.name;
      return (
        <div className="flex items-center justify-start">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 drop-shadow-md border-none"
          >
            <div className="flex items-center gap-2">
              
              <span className="font-semibold">{religionName}</span>
            </div>
          </Badge>
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
      return sequence ? (
        <Badge 
          variant="outline" 
          className="px-2.5 py-1.5 text-xs   bg-blue-50 text-blue-600  drop-shadow-md border-none font-mono"
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
          <ActionEntityMenu type="Religion" data={row.original} />
        </div>
      );
    },
  },
];