import { ColumnDef } from "@tanstack/react-table";
import { 
  Folder,
  Hash,
  FileText,
  Check,
  X,
  Hash as HashIcon,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Edit,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/resources/category.types";
import { Button } from "@/components/ui/button";

export const categoryColumns = (onEditRow?: (rowData: Category) => void): ColumnDef<Category>[] => [
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
    accessorKey: "sequence",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <HashIcon className="h-5 w-5 text-purple-600" />
        <span>Sequence</span>
      </div>
    ),
    cell: ({ row }) => {
      const sequence = row.original.sequence;
      return (
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 drop-shadow-md border-none font-mono">
            {sequence || '-'}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "disabled",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <Eye className="h-5 w-5 text-purple-600" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const isDisabled = row.original.disabled;
      return (
        <Badge 
          variant="outline" 
          className={`px-2.5 py-1 drop-shadow-md border-none text-xs ${isDisabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
        >
          <div className="flex items-center gap-1">
            {isDisabled ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Disabled</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Active</span>
              </>
            )}
          </div>
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <Calendar className="h-5 w-5 text-purple-600" />
        <span>Created</span>
      </div>
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.original.createdAt);
      return (
        <div className="flex items-center justify-center text-xs text-gray-600">
          {createdAt.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold whitespace-nowrap">
        <Clock className="h-5 w-5 text-purple-600" />
        <span>Updated</span>
      </div>
    ),
    cell: ({ row }) => {
      const updatedAt = new Date(row.original.updatedAt);
      return (
        <div className="flex items-center justify-center text-xs text-gray-600">
          {updatedAt.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const rowData = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEditRow && onEditRow(rowData)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      );
    },
  },
];