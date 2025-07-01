import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomPaginationState } from "@/components/settings/SettingsContent";
import React from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { Row } from "@tanstack/react-table";
import type { QueryObserverResult } from "@tanstack/react-query";

type Batch = {
  id: string;
  name: string;
  course: string;
  section: string;
  session: string;
  shift: string;
  totalStudents: number;
};

const mockBatches: Batch[] = [
  { id: "batch-1", name: "Batch A", course: "BSc", section: "A", session: "2023-24", shift: "Morning", totalStudents: 32 },
  { id: "batch-2", name: "Batch B", course: "BCom", section: "B", session: "2023-24", shift: "Evening", totalStudents: 28 },
  { id: "batch-3", name: "Batch C", course: "BA", section: "A", session: "2022-23", shift: "Morning", totalStudents: 30 },
  { id: "batch-4", name: "Batch D", course: "BSc", section: "B", session: "2022-23", shift: "Evening", totalStudents: 27 },
  { id: "batch-5", name: "Batch E", course: "BBA", section: "A", session: "2023-24", shift: "Morning", totalStudents: 35 },
  { id: "batch-6", name: "Batch F", course: "BCA", section: "B", session: "2023-24", shift: "Evening", totalStudents: 29 },
  { id: "batch-7", name: "Batch G", course: "BCom", section: "A", session: "2022-23", shift: "Morning", totalStudents: 31 },
  { id: "batch-8", name: "Batch H", course: "BA", section: "B", session: "2022-23", shift: "Evening", totalStudents: 26 },
  { id: "batch-9", name: "Batch I", course: "BSc", section: "C", session: "2023-24", shift: "Morning", totalStudents: 34 },
  { id: "batch-10", name: "Batch J", course: "BBA", section: "C", session: "2023-24", shift: "Evening", totalStudents: 30 },
  { id: "batch-11", name: "Batch K", course: "BCom", section: "C", session: "2022-23", shift: "Morning", totalStudents: 33 },
  { id: "batch-12", name: "Batch L", course: "BCA", section: "A", session: "2022-23", shift: "Evening", totalStudents: 28 },
  { id: "batch-13", name: "Batch M", course: "BA", section: "C", session: "2023-24", shift: "Morning", totalStudents: 32 },
  { id: "batch-14", name: "Batch N", course: "BBA", section: "B", session: "2022-23", shift: "Evening", totalStudents: 29 },
  { id: "batch-15", name: "Batch O", course: "BCA", section: "C", session: "2023-24", shift: "Morning", totalStudents: 30 },
  { id: "batch-16", name: "Batch P", course: "BSc", section: "D", session: "2023-24", shift: "Evening", totalStudents: 31 },
  { id: "batch-17", name: "Batch Q", course: "BCom", section: "D", session: "2022-23", shift: "Morning", totalStudents: 27 },
  { id: "batch-18", name: "Batch R", course: "BBA", section: "D", session: "2022-23", shift: "Evening", totalStudents: 33 },
  { id: "batch-19", name: "Batch S", course: "BA", section: "D", session: "2023-24", shift: "Morning", totalStudents: 29 },
  { id: "batch-20", name: "Batch T", course: "BCA", section: "D", session: "2023-24", shift: "Evening", totalStudents: 34 },
];


const courses = ["BSc", "BCom", "BA"];
const sessions = ["2023-24", "2022-23"];
const shifts = ["Morning", "Evening"];
const sections = ["A", "B"];

const columns: ColumnDef<Batch, unknown>[] = [
  { accessorKey: "name", header: "Batch Name / ID" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "section", header: "Section" },
  { accessorKey: "session", header: "Session" },
  { accessorKey: "shift", header: "Shift" },
  { accessorKey: "totalStudents", header: "Total Students" },
];

export default function HomePage() {
  const [course, setCourse] = useState("");
  const [session, setSession] = useState("");
  const [shift, setShift] = useState("");
  const [section, setSection] = useState("");
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalElements: mockBatches.length,
  });
  const navigate = useNavigate();

  // Filter logic
  const filteredBatches = mockBatches.filter(batch =>
    (!course || batch.course === course) &&
    (!session || batch.session === session) &&
    (!shift || batch.shift === shift) &&
    (!section || batch.section === section)
  );

  // Pagination logic
  const totalElements = filteredBatches.length;
  const totalPages = Math.ceil(totalElements / pagination.pageSize) || 1;
  const paginatedBatches = filteredBatches.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  // Update pagination state when filteredBatches changes
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalElements,
      totalPages,
      pageIndex: Math.min(prev.pageIndex, totalPages - 1),
    }));
  }, [totalElements, totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
          >
            <CalendarDays className="h-8 w-8 drop-shadow-xl text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Batches</h2>
            <p className="text-sm text-purple-600 font-medium">
              Manage and explore all academic batches. Use filters to narrow your search.
            </p>
          </div>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
        />
      </motion.div>
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center flex-col">
        {/* Filters Card */}
        <div className="w-full bg-white rounded-xl shadow-md px-8 py-6 mb-8 flex flex-wrap gap-4 items-center border border-gray-100">
          <span className="font-medium text-gray-700 mr-2">Filters:</span>
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>{sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Shift" /></SelectTrigger>
            <SelectContent>{shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>{sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => { setCourse(""); setSession(""); setShift(""); setSection(""); }}
          >
            Reset
          </Button>
        </div>
        {/* Table Card */}
        <div className="w-full bg-white rounded-xl shadow-md px-2 py-4">
          <DataTable
            columns={columns as ColumnDef<unknown, unknown>[]}
            data={paginatedBatches}
            pagination={pagination}
            isLoading={false}
            setPagination={setPagination}
            searchText={""}
            setSearchText={() => {}}
            setDataLength={() => {}}
            onRowClick={(row: Row<Batch>) => navigate(`/dashboard/batches/${row.original.id}`)}
            refetch={async () => Promise.resolve({} as QueryObserverResult<unknown[] | undefined, Error>)}
          />
        </div>
      </div>
    </div>
  );
}
