import React, { useEffect, useState } from "react";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { ReportColumns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";
import { getAllReports } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/components/globals/useReportStore";

const Page: React.FC = () => {
  const { filters, setFilteredData, filteredData } = useReportStore();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data } = useQuery({
    queryKey: ["reports", filters, pagination],
    queryFn: () =>
      getAllReports({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,
        framework: filters.framework ?? undefined,
        semester: filters.semester,
        showFailedOnly: filters.showFailedOnly,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
  });

  useEffect(() => {
    if (data) {
      // console.log("Data fetched from api ******", JSON.stringify(data.payload.content, null, 2));
      setFilteredData(data.payload.content);
    }
    // console.log("Filtered Data in report page ******:", JSON.stringify(filteredData, null, 2));
  }, [data, setFilteredData, filteredData]);

  return (
    <div>
      <div className="mt-10">
        {" "}
        <FilterAndExportComponent />
      </div>
      <div className=" mx-auto max-w-[1270px]  p-2"> 
        <DataTable
          columns={ReportColumns}
          data={filteredData || []}
          pageCount={data?.payload.totalPages || 0}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  );
};

export default Page;
