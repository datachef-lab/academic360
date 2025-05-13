// import { ColumnDef } from "@tanstack/react-table";
// import { Category } from "@/types/resources/category";
// import ActionEntityMenu from "../../settings/ActionEntityMenu";

// export const categoryColumns: ColumnDef<Category>[] = [
//   {
//     accessorKey: "name",
//     header: "Name",
//   },
//   {
//     accessorKey: "code",
//     header: "Code",
//   },
//   {
//     accessorKey: "documentRequired",
//     header: "Document Required?",
//     cell: ({ row }) => {
//       if (row.getValue("documentRequired")) {
//         return <span>Yes</span>;
//       }
//       return <span>No</span>;
//     },
  
//   },
//   {
//     accessorKey: "action",
//     header: "Action",
//     cell:({row})=>{
//       return <ActionEntityMenu type="Category" data={row.original} ></ActionEntityMenu>
//     }
//   },
// ];
import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@/types/resources/category";
import ActionEntityMenu from "../../settings/ActionEntityMenu";
import { 
  Folder,
  Hash,
  FileText,
  Settings2,
  Check,
  X
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start gap-2 text-slate-800 font-semibold">
        <Folder className="h-5 w-5 text-purple-600" />
        <span>Category</span>
      </div>
    ),
    cell: ({ row }) => {
      const categoryName = row.original.name;
      return (
        <div className="flex items-center justify-start">
          <div className="ml-2">
            <div className="text-sm font-semibold text-gray-800">{categoryName}</div>
           
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <Hash className="h-5 w-5 text-purple-600" />
        <span>Category Code</span>
      </div>
    ),
    cell: ({ row }) => {
      const code = row.original.code;
      return (
        <Badge variant="outline" className="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-700 drop-shadow-md border-none font-mono">
          {code}
        </Badge>
      );
    },
  },
  {
    accessorKey: "documentRequired",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <FileText className="h-5 w-5 text-purple-600" />
        <span>Docs Required</span>
      </div>
    ),
    cell: ({ row }) => {
      const isRequired = row.original.documentRequired;
      return (
        <Badge 
          variant="outline" 
          className={`px-2.5 py-1 drop-shadow-md border-none text-xs ${isRequired ? 'bg-green-50 text-green-600 ' : 'bg-pink-50 text-pink-600 '}`}
        >
          <div className="flex items-center gap-1">
            {isRequired ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Required</span>
              </>
            ) : (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Not Required</span>
              </>
            )}
          </div>
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
         
          <ActionEntityMenu type="Category" data={row.original} />
          
        </div>
      );
    },
  },
];