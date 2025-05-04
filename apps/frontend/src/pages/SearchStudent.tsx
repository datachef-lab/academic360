import { useState } from "react";
import { CustomPaginationState } from "@/components/settings/SettingsContent";

import { useQuery } from "@tanstack/react-query";
import { getAllStudents, getSearchedStudents } from "@/services/student";
import { DataTable } from "@/components/ui/data-table";
import { studentSearchColumns, StudentSearchType } from "@/components/tables/users/student-search-column";
import { formattedStudent } from "@/components/StudentSearch/helper";
import { useReportStore } from "@/components/globals/useReportStore";
import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";



export default function SearchStudent() {

  const [searchText, setSearchText] = useState("");
  const {setStudentData,StudentData}=useReportStore();

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
      console.log("fetched data",JSON.stringify(data.payload.content[0],null,2));
      

      const { content, page, pageSize, totalElements, totalPages } = data.payload;
      console.log("content/***",content);
      setStudentData(content);

      console.log({ pageIndex: page - 1, pageSize, totalElements, totalPages });

      setPagination((prev) => ({ ...prev, totalElements, totalPages }));

      const formattedData = formattedStudent(content);

      setData(formattedData);

      setDataLength(formattedData.length);
      console.log("studentData/*****",StudentData);
      console.log("First few formatted students:", formattedData.slice(0, 3).map(student => ({
        id: student.id,
        name: student.name,
        uid: student.uid,
        avatar: student.avatar
      })));

      return formattedData;
    },
    enabled: searchText.trim() == "",
  });

  // Fetch the filtered data using React Query
  const { isFetching: isFetchingSearch, refetch } = useQuery({
    queryKey: ["students", pagination.pageIndex, pagination.pageSize, searchText, dataLength],
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
    },
    enabled: false,
  }) as { isFetching: boolean; refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<StudentSearchType[] | undefined, Error>> };

  return (
    <div className="overflow-x-auto  w-full h-full   bg-transparent ">
      
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
