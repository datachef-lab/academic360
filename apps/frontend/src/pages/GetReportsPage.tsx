import React, { useEffect, useState,useRef } from "react";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { ReportColumns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";
import { getAllReports } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/components/globals/useReportStore";
import useDebounce from "@/components/Hooks/useDebounce";

const Page: React.FC = () => {
  const { filters, setFilteredData, filteredData } = useReportStore();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
const debouncePagination= useDebounce(pagination, 500)
const lastPageCountRef = useRef(0); 


  const { data ,isLoading} = useQuery({
    queryKey: ["reports", filters, debouncePagination],
    queryFn: () =>
      getAllReports({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,
        framework: filters.framework ?? undefined,
        semester: filters.semester??undefined,
        // showFailedOnly: filters.showFailedOnly,
        page: debouncePagination.pageIndex + 1,
        pageSize: debouncePagination.pageSize,
      }),
     placeholderData: (prevData) => prevData,
      staleTime: 6000,
      // refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      console.log("Data fetched:", data.payload.content);
      setFilteredData(data.payload.content);
      lastPageCountRef.current = data.payload.totalPages; 
    }
   
  }, [data, setFilteredData]);

  return (
    <div>
      <div className="mt-10">
        {" "}
        <FilterAndExportComponent />
      </div>
      <div className=" mx-auto max-w-[1270px]  p-2"> 
        <DataTable
          isLoading={isLoading}
          columns={ReportColumns}
          data={filteredData || []}
          pageCount={lastPageCountRef.current}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  );
};

export default Page;
