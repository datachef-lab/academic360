import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { CourseMaterialRow } from "./types";
import { Button } from "@/components/ui/button";
import AddMaterialModal from "./AddMaterialModal";
import { BookOpen, Tag, FileText, Layers, FileIcon, PlusCircle, Plus } from "lucide-react";

const AddMaterialActionCell = ({ row }: { row: { original: CourseMaterialRow } }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        className="bg-gradient-to-r hover:text-white from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-xl px-4 py-2 rounded-md flex items-center gap-2 transition-all"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" /> Add Material
      </Button>
      <AddMaterialModal
        open={open}
        onClose={() => setOpen(false)}
        subject={{
          subject: row.original.subject,
          type: row.original.type,
          paper: row.original.paper,
        }}
        onSave={() => setOpen(false)}
      />
    </div>
  );
};

export const getCourseMaterialColumns = (): ColumnDef<CourseMaterialRow>[] => [
  {
    id: "serial", 
    header: () => (
      <span className="flex items-center justify-center gap-2">
        <Layers className="w-4 h-4 text-purple-600" />
        Sr. No
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-center font-medium">{row.index + 1}</span>
    ),
    size: 60,
  },
  {
    accessorKey: "subject",
    header: () => (
      <span className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-600" />
        Subject
      </span>
    ),
    cell: info => <span className="font-semibold">{info.getValue() as string}</span>,
  },
  {
    accessorKey: "type",
    header: () => (
      <span className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-purple-600" />
        Type
      </span>
    ),
  },
  {
    accessorKey: "paper",
    header: () => (
      <span className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-purple-600" />
        Paper
      </span>
    ),
  },
  {
    accessorKey: "materials",
    header: () => (
      <span className="flex items-center gap-2">
        <FileIcon className="w-4 h-4 text-purple-600" />
        Materials
      </span>
    ),
    cell: info => info.getValue() ? info.getValue() : <span className="text-gray-500">No materials</span>,
  },
  {
    id: "actions",
    header: () => (
      <span className="flex items-center justify-center gap-2">
        <PlusCircle className="w-4 h-4 text-purple-600" />
        Actions
      </span>
    ),
    cell: AddMaterialActionCell,
    size: 160,
  },
]; 