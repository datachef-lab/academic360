import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Star, Award, FileText, Calendar, User, BookOpen } from "lucide-react";


export const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "id",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <FileText className="h-4 w-4 " />
        <span>ID</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 font-medium">
        #{row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <BookOpen className="h-4 w-4 " />
        <span>Title</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 font-medium">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <User className="h-4 w-4 " />
        <span>Author</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("author")}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <Calendar className="h-4 w-4 " />
        <span>Date</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {new Date(row.getValue("date")).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <CheckCircle2 className="h-4 w-4 " />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex justify-center">
          {status === "Active" && (
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 className="h-4 w-4  mr-1" />
              Active
            </Badge>
          )}
          {status === "Inactive" && (
            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50">
              <XCircle className="h-4 w-4  mr-1" />
              Inactive
            </Badge>
          )}
          {status === "Pending" && (
            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
              <Clock className="h-4 w-4  mr-1" />
              Pending
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <Star className="h-4 w-4 " />
        <span>Priority</span>
      </div>
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <div className="flex justify-center">
          {priority === "High" && (
            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50">
              <Star className="h-4 w-4  mr-1" />
              High
            </Badge>
          )}
          {priority === "Medium" && (
            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
              <Star className="h-4 w-4  mr-1" />
              Medium
            </Badge>
          )}
          {priority === "Low" && (
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              <Star className="h-4 w-4  mr-1" />
              Low
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "score",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <Award className="h-4 w-4 " />
        <span>Score</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
          <Award className="h-4 w-4  mr-1" />
          {row.getValue("score")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: () => (
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <FileText className="h-4 w-4 " />
        <span>Remarks</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-600 max-w-[200px] truncate">
        {row.getValue("remarks")}
      </div>
    ),
  },
]; 