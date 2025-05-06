import React, { useRef, useState, useEffect } from 'react';
import { getAllMarksheet } from '@/services/student-apis';
import useDebounce from '../Hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DataTable } from '../reports/DataTable';
import { MarksheetColumns } from '../reports/marksheetColumns';
import { useMarksheetStore } from '@/stores/useTableStore';
import CommonFilterAndExport from '../common/CommonFilterAndExport';
import { MarksheetTableType } from '@/types/tableTypes/MarksheetTableType';


const MarksheetDownloads = (): JSX.Element => {
  const {filters,filteredData,setFilteredData}=useMarksheetStore()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncePagination = useDebounce(pagination, 400);
  const lastPageCountRef = useRef(0);

  const { data:marksheetData, isLoading } = useQuery({
    queryKey: ["marksheet", filters, debouncePagination],
    queryFn: () =>
      getAllMarksheet({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,
        
        semester: filters.semester ?? undefined,
        page: debouncePagination.pageIndex + 1,
        pageSize: debouncePagination.pageSize,
      }),
    placeholderData: (prevData: MarksheetTableType) => prevData,
    staleTime: 10000,
  });

  useEffect(() => {
    if (marksheetData) {
      console.log("marksheetData",marksheetData.data);
      setFilteredData( marksheetData.data);
      lastPageCountRef.current = marksheetData.totalPages;
    }
  }, [marksheetData, setFilteredData]);

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
          <CommonFilterAndExport></CommonFilterAndExport>
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full"
        >
          <DataTable<MarksheetTableType, unknown>
            isLoading={isLoading}
            columns={MarksheetColumns}
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

export default MarksheetDownloads;