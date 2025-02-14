import { useState } from "react";
import { CustomPaginationState } from "@/components/settings/SettingsContent";

import { useQuery } from "@tanstack/react-query";
import { getAllStudents, getSearchedStudents } from "@/services/student";
import { DataTable } from "@/components/ui/data-table";
import { studentSearchColumns, StudentSearchType } from "@/components/tables/users/student-search-column";
import { formattedStudent } from "@/components/StudentSearch/helper";

export default function SearchStudent() {
  const [searchText, setSearchText] = useState("");

  const [data, setData] = useState<StudentSearchType[]>([]);
  const [dataLength, setDataLength] = useState<number>(0);

  //   const [filteredData, setFilteredData] = useState<StudentSearchType[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0, // TanStack Table is 0-based
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });

  const { isFetching: isFetchingDefault } = useQuery({
    queryKey: ["search-student", { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
    queryFn: async () => {
      const data = await getAllStudents(pagination.pageIndex + 1, pagination.pageSize);
      console.log(data);

      const { content, page, pageSize, totalElements, totalPages } = data.payload;

      console.log({ pageIndex: page - 1, pageSize, totalElements, totalPages });

      setPagination((prev) => ({ ...prev, totalElements, totalPages }));

      const formattedData = formattedStudent(content);

      setData(formattedData);

      setDataLength(formattedData.length);

      return formattedData;
    },
    enabled: searchText.trim() == "",
  });

  // Fetch the filtered data using React Query
  const { isFetching: isFetchingSearch, refetch } = useQuery({
    queryKey: ["students", pagination.pageIndex, pagination.pageSize, searchText, dataLength], // Query key with pagination and filter
    queryFn: async () => {
      if (searchText.trim() !== "") {
        const data = await getSearchedStudents(
          pagination.pageIndex + 1,
          pagination.pageSize,
          searchText.trim().toLowerCase(),
        );

        console.log("while searching:", data);
        const { content, page, totalElements, totalPages } = data.payload;

        setPagination((prev) => ({ ...prev, pageIndex: page - 1, totalElements, totalPages }));

        const formattedData = formattedStudent(content);

        setData(formattedData);

        setDataLength(formattedData.length);

        return formattedData;
      }
    }, // Query function with page, pageSize, and search text
    enabled: false,
  });

  return (
    <div className="overflow-x-auto  w-full h-full  p-2 ">
      <DataTable
        isLoading={isFetchingDefault || isFetchingSearch}
        data={data || []}
        searchText={searchText}
        setSearchText={setSearchText}
        columns={studentSearchColumns}
        pagination={pagination}
        setPagination={setPagination}
        setDataLength={setDataLength}
        refetch={refetch}
      />
    </div>
  );
}
