import React, { useRef, useState, useEffect } from "react";
import useDebounce from "../Hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DataTable } from "../reports/DataTable";
import { useStudentDownloadStore } from "../globals/useStudentDownloadStore";
import { getFilteredStudents } from "@/services/student";
import StudentDownloadFilterAndExport from "./StudentDownloadFilterAndExport";
import type { StudentDto } from "@repo/db/dtos/user";
import { Student } from "@/types/user/student";
import { studentDownloadColumns } from "./StudentDownloadColumn";

const StudentDownloads: React.FC = () => {
  const { filters, filteredData, setFilteredData } = useStudentDownloadStore();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncePagination = useDebounce(pagination, 400);
  const lastPageCountRef = useRef(0);

  const { data, isLoading } = useQuery(
    ["studentDownload", filters, debouncePagination],
    () =>
      getFilteredStudents({
        stream: filters.stream ?? "",
        year: filters.year?.toString() ?? "",
        framework: filters.framework ?? "",
        semester: filters.semester?.toString() ?? "",
        page: (debouncePagination.pageIndex + 1).toString(),
        pageSize: debouncePagination.pageSize.toString(),
      }),
    {
      staleTime: 10000,
    },
  );

  useEffect(() => {
    if (data) {
      console.log("data", data.totalPages);

      // Transform StudentDto[] to Student[] format
      const transformedData: Student[] = data.content.map((studentDto: StudentDto) => ({
        id: studentDto.id,
        name: studentDto.personalDetails?.firstName || "",
        userId: 0, // Not available in StudentDto
        applicationId: studentDto.applicationFormAbstract?.id || null,
        community: null, // Not available in StudentDto
        handicapped: studentDto.handicapped || false,
        level: null, // Not available in StudentDto
        framework: null, // Not available in StudentDto
        specializationId: studentDto.specialization?.id || 0,
        shift: null, // Simplified - not mapping the complex shift object
        lastPassedYear: 0, // Not available in StudentDto
        notes: "",
        active: true, // Default value
        alumni: false, // Default value
        leavingDate: new Date(), // Default to current date
        leavingReason: "",
        specialization: null, // Simplified - not mapping the complex specialization object
        academicIdentifier: null, // Not available in StudentDto
        personalDetails: null, // Simplified - not mapping the complex personalDetails object
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      setFilteredData(transformedData);

      lastPageCountRef.current = data.totalPages;
    }
  }, [data, setFilteredData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-0 sm:px-2 lg:px-2"
    >
      <div className="w-full mt-4 max-w-auto mx-auto p-6 grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full"
        >
          <StudentDownloadFilterAndExport></StudentDownloadFilterAndExport>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full"
        >
          <DataTable
            isLoading={isLoading}
            columns={studentDownloadColumns}
            data={filteredData || []}
            pageCount={lastPageCountRef.current}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentDownloads;
