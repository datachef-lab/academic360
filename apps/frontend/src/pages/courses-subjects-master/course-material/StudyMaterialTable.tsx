import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FileIcon, Link as LinkIcon, Pencil, Trash2 } from "lucide-react";
import { StudyMaterial } from "@/types/academics/study-material";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration
const mockMaterials: StudyMaterial[] = [
  {
    id: 1,
    name: "Lecture Notes Week 1",
    type: "FILE",
    variant: "RESOURCE",
    availability: "ALWAYS",
    subjectMetadataId: 1,
    sessionId: 1,
    courseId: 1,
    batchId: 1,
    url: null,
    filePath: "/files/notes-week1.pdf",
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Assignment 1",
    type: "LINK",
    variant: "ASSIGNMENT",
    availability: "CURRENT_SESSION_ONLY",
    subjectMetadataId: 1,
    sessionId: 1,
    courseId: 1,
    batchId: 1,
    url: "https://example.com/assignment1",
    filePath: null,
    dueDate: new Date("2025-07-07"),
    createdAt: new Date(),
    updatedAt: new Date("2025-07-06T15:30:00"),
  },
];

const badgeColor = (type: string) => {
  switch (type) {
    case "FILE":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "LINK":
      return "bg-green-100 text-green-700 border-green-200";
    case "RESOURCE":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "WORKSHEET":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "ASSIGNMENT":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "PROJECT":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "ALWAYS":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "CURRENT_SESSION_ONLY":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "COURSE_LEVEL":
      return "bg-teal-100 text-teal-700 border-teal-200";
    case "BATCH_LEVEL":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const columns: ColumnDef<StudyMaterial>[] = [
  {
    accessorKey: "name",
    header: () => (
      <span className="font-medium">Name</span>
    ),
    cell: info => {
      const mat = info.row.original;
      return (
        <div className="flex flex-col gap-1 min-w-[220px]">
          <span className="font-medium text-base">{mat.name}</span>
          <div className="flex flex-row gap-2 mt-1 flex-nowrap overflow-x-auto max-w-xs">
            <Badge className={`text-xs border whitespace-nowrap ${badgeColor(mat.type)} hover:${badgeColor(mat.type)}`}>{mat.type}</Badge>
            <Badge className={`${badgeColor(mat.variant)} hover:${badgeColor(mat.variant)} text-xs border whitespace-nowrap`}>{mat.variant}</Badge>
            <Badge className={`${badgeColor(mat.availability)} hover:${badgeColor(mat.availability)} text-xs border whitespace-nowrap`}>{mat.availability}</Badge>
          </div>
        </div>
      );
    },
    size: 320,
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : "-",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : "-",
  },
  {
    id: "fileOrLink",
    header: "File/Link",
    cell: ({ row }) => {
      const mat = row.original;
      if (mat.type === "FILE" && mat.filePath) {
        return (
          <a href={mat.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
            <FileIcon className="w-4 h-4" /> File
          </a>
        );
      }
      if (mat.type === "LINK" && mat.url) {
        return (
          <a href={mat.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
            <LinkIcon className="w-4 h-4" /> Link
          </a>
        );
      }
      return <span className="text-gray-400">-</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    ),
    size: 80,
  },
];

const PAGE_SIZE = 10;

const StudyMaterialTable: React.FC = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    totalElements: mockMaterials.length,
    totalPages: 1,
  });
  const [searchText, setSearchText] = useState("");
  const setDataLength = useState(mockMaterials.length)[1];

  // Filtering for demo
  const filtered = useMemo(() =>
    mockMaterials.filter(mat =>
      mat.name.toLowerCase().includes(searchText.toLowerCase())
    ), [searchText]
  );

  // Pagination for demo
  const paged = useMemo(() =>
    filtered.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize
    ), [filtered, pagination]
  );

  return (
    <div className="rounded-xl border border-gray-200 py-3 drop-shadow-md overflow-x-auto bg-white">
      <DataTable<StudyMaterial, unknown>
        columns={columns}
        data={paged}
        pagination={pagination}
        isLoading={false}
        setPagination={setPagination}
        searchText={searchText}
        setSearchText={setSearchText}
        setDataLength={setDataLength}
        refetch={async () => Promise.resolve({} as import("@tanstack/react-query").QueryObserverResult<StudyMaterial[] | undefined, Error>)}
        viewDataToolbar={true}
      />
    </div>
  );
};

export default StudyMaterialTable; 