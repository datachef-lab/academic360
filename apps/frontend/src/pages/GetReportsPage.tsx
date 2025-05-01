import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { ReportColumns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";
import { getAllReports } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/components/globals/useReportStore";
import useDebounce from "@/components/Hooks/useDebounce";
import { BarChart2 } from "lucide-react";

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
    placeholderData: (prevData: typeof Report) => prevData,
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
      className="min-h-screen  bg-gradient-to-br from-teal-50 to-white items-center justify-center px-2 py-0 sm:px-2 lg:px-2"
    >
         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-4 sm:p-6 mt-2 bg-white/30 backdrop-blur-sm"
                          >
                            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                              <motion.div
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl drop-shadow-lg"
                              >
                                <BarChart2 className="h-7 w-7 text-white" />
                              </motion.div>
                              <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Student Report</h2>
                                <p className="text-sm text-teal-600 font-medium">Analyze and export comprehensive student performance data</p>
                              </div>
                            </div>
                    
                           
                    
                          <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-1 bg-gradient-to-r mt-2 from-teal-400 via-teal-500 to-teal-400 rounded-full origin-left col-span-full"
                            />
                          </motion.div>
      <div className="w-full mt-4  max-w-auto mx-auto p-6 grid grid-cols-1 gap-6">
        {/* Header Section */}
        {/* <motion.div
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
        </motion.div> */}
         
                         
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full "
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
