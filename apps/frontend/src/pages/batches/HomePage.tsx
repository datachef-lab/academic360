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
import { useQuery } from "@tanstack/react-query";
import { getAllBatches } from "@/services/batch";
import { BatchSummary } from "@/types/academics/batch";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getAllCourses } from "@/services/course-api";
import { getAllShifts, getAllSections } from "@/services/academic";
import { AcademicYear } from "@/types/academics/academic-year";
import { Course } from "@/types/academics/course";
import { Shift } from "@/types/academics/shift";
import { Section } from "@/types/academics/section";

const columns: ColumnDef<BatchSummary, unknown>[] = [
  { accessorKey: "id", header: "Batch ID" },
  { accessorKey: "courseName", header: "Course" },
  { accessorKey: "className", header: "Class" },
  { accessorKey: "sectionName", header: "Section" },
  { accessorKey: "shift", header: "Shift" },
  { accessorKey: "session", header: "Session" },
  { accessorKey: "totalStudents", header: "Total Students" },
  { accessorKey: "totalSubjects", header: "Total Subjects" },
];

export default function HomePage() {
  const [course, setCourse] = useState("");
  const [shift, setShift] = useState("");
  const [section, setSection] = useState("");
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalElements: 0,
  });
  const navigate = useNavigate();

  // Fetch filter options from backend
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ["academicYears"],
    queryFn: async () => (await getAllAcademicYears()).payload,
  });
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => (await getAllCourses()).payload,
  });
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["shifts"],
    queryFn: getAllShifts,
  });
  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ["sections"],
    queryFn: getAllSections,
  });

  // Fetch batches from backend with academicYearId filter
  const { data: batches = [], isLoading, error } = useQuery<BatchSummary[]>({
    queryKey: ["batches", academicYearId],
    queryFn: () => getAllBatches(academicYearId),
  });

  // Filter logic (frontend filters for course, shift, section)
  const filteredBatches = batches.filter(batch =>
    (!course || batch.courseName === course) &&
    (!shift || (typeof batch.shift === 'string' ? batch.shift : batch.shift?.name) === shift) &&
    (!section || batch.sectionName === section)
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
          <Select value={academicYearId ? academicYearId.toString() : ""} onValueChange={v => setAcademicYearId(v ? Number(v) : undefined)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Academic Year" /></SelectTrigger>
            <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id?.toString() || ""}>{y.year}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Shift" /></SelectTrigger>
            <SelectContent>{shifts.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => { setAcademicYearId(undefined); setCourse(""); setShift(""); setSection(""); }}
          >
            Reset
          </Button>
        </div>
        {/* Table Card */}
        <div className="w-full bg-white rounded-xl shadow-md px-2 py-4">
          <DataTable
            columns={columns}
            data={paginatedBatches}
            pagination={pagination}
            isLoading={isLoading}
            setPagination={setPagination}
            searchText={""}
            setSearchText={() => {}}
            setDataLength={() => {}}
            onRowClick={(row: Row<BatchSummary>) => navigate(`/dashboard/batches/${row.original.id}`)}
            refetch={async () => Promise.resolve({} as QueryObserverResult<BatchSummary[] | undefined, Error>)}
          />
          {error ? <div className="text-red-500 p-4">Failed to load batches.</div> : null}
        </div>
      </div>
    </div>
  );
}
