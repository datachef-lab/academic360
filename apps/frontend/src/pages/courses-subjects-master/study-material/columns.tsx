import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { StudyMaterialRow } from "./types";
import { Button } from "@/components/ui/button";
import AddMaterialModal from "./AddMaterialModal";
import { BookOpen, Tag, Layers, Link, ListChecks, FileIcon, PlusCircle, Plus, Globe, CheckCircle } from "lucide-react";

const AddMaterialActionCell = ({ row }: { row: { original: StudyMaterialRow } }) => {
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

export const getStudyMaterialColumns = (): ColumnDef<StudyMaterialRow>[] => [
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
    accessorKey: "name",
    header: () => (
      <span className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-600" />
        Name
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
    accessorKey: "availability",
    header: () => (
      <span className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-purple-600" />
        Availability
      </span>
    ),
  },
  {
    accessorKey: "variant",
    header: () => (
      <span className="flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-purple-600" />
        Variant
      </span>
    ),
  },
  {
    accessorKey: "url",
    header: () => (
      <span className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-purple-600" />
        URL
      </span>
    ),
    cell: info => info.getValue() ? <a href={info.getValue() as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a> : <span className="text-gray-500">No URL</span>,
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