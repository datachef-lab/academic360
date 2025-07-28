import { ColumnDef } from "@tanstack/react-table";
import { LanguageMedium } from "@/types/resources/language-medium.types";
import { 
  Languages, 
  Edit,
  Calendar,
  Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export const languageMediumColumns = (onEditRow?: (rowData: LanguageMedium) => void): ColumnDef<LanguageMedium>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span className="font-mono text-sm text-gray-500">
            #{row.getValue("id")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Language",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
    cell: ({ row }) => {
      const sequence = row.getValue("sequence") as number | null;
      return (
        <div className="flex items-center">
          {sequence ? (
            <Badge variant="secondary" className="font-mono">
              {sequence}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "disabled",
    header: "Status",
    cell: ({ row }) => {
      const disabled = row.getValue("disabled") as boolean;
      return (
        <Badge variant={disabled ? "destructive" : "default"}>
          {disabled ? "Disabled" : "Active"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {date.toLocaleDateString()}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {date.toLocaleDateString()}
          </span>
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



