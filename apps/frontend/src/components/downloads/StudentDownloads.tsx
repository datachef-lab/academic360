import React, { useRef, useState, useEffect } from 'react';
import useDebounce from '../Hooks/useDebounce';
import { useQuery } from "@tanstack/react-query";
import { motion } from 'framer-motion';
import { DataTable } from '../reports/DataTable';
import { useStudentDownloadStore } from '../globals/useStudentDownloadStore';
import { getFilteredStudents } from '@/services/student';
import StudentDownloadFilterAndExport from './StudentDownloadFilterAndExport';
import { Student } from '@/types/user/student';
import { studentDownloadColumns } from './StudentDownloadColumn';


const StudentDownloads: React.FC = () => {
  const {filters,filteredData,setFilteredData}=useStudentDownloadStore()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncePagination = useDebounce(pagination, 400);
  const lastPageCountRef = useRef(0);
  
  const { data, isLoading } = useQuery({
    queryKey: ["studentDownload", filters, debouncePagination],
    queryFn: () => 
      getFilteredStudents({
        stream: filters.stream ?? undefined,
        year: filters.year?? undefined,
        framework: filters.framework ?? undefined,
        semester: filters.semester ?? undefined,
        page: debouncePagination.pageIndex + 1,
        pageSize: debouncePagination.pageSize,
      }),
    placeholderData: (prevData: Student) => prevData,
    staleTime: 10000,
   
  });

  useEffect(() => {
    if (data) {
      console.log("data", data.totalPages);
    
      setFilteredData(data.content);
     
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
            data={filteredData|| []}
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