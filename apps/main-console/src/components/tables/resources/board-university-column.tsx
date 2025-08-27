import { BoardUniversity } from "@/types/resources/board-university.types";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Edit,
  Calendar,
  Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const boardUniversityColumns = (onEditRow?: (rowData: BoardUniversity) => void): ColumnDef<BoardUniversity>[] => [
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
    header: "Board/University",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const code = row.getValue("code") as string | null;
      return (
        <div className="flex items-center">
          {code ? (
            <Badge variant="outline" className="font-mono">
              {code}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "passingMarks",
    header: "Passing Marks",
    cell: ({ row }) => {
      const passingMarks = row.getValue("passingMarks") as number | null;
      return (
        <div className="flex items-center">
          {passingMarks ? (
            <Badge variant="secondary" className="font-mono">
              {passingMarks}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
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
        <Badge className={`${disabled ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
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