import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { ReportColumns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";
import { getAllReports } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/components/globals/useReportStore";
import useDebounce from "@/components/Hooks/useDebounce";
import { BarChart2, BookOpen } from "lucide-react";

const Page: React.FC = () => {
  const { filters, setFilteredData, filteredData } = useReportStore();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncePagination = useDebounce(pagination, 400);
  const lastPageCountRef = useRef(0);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", filters, debouncePagination], 
    queryFn: () =>
      getAllReports({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,
        framework: filters.framework ?? undefined,
        semester: filters.semester ?? undefined,
        page: debouncePagination.pageIndex + 1,
        pageSize: debouncePagination.pageSize,
      }), 
    placeholderData: (prevData) => prevData,
    staleTime: 6000,
  });
  

  useEffect(() => {
    if (data) {
      setFilteredData(data.payload.content);
      lastPageCountRef.current = data.payload.totalPages;
    }
  }, [data, setFilteredData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-auto mx-auto grid grid-cols-1 gap-6">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mb-3">
            <BarChart2 className="h-10 w-10" strokeWidth={1.5} />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text">Student Report</h1>
          </div>
          <p className="text-lg flex items-center justify-center sm:justify-start gap-2">
            <BookOpen className="h-5 w-5" />
            Analyze and export comprehensive student performance data
          </p>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full"
        >
          <FilterAndExportComponent />
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full"
        >
          <DataTable
            isLoading={isLoading}
            columns={ReportColumns}
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

export default Page;
