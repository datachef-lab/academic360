// import { useEffect, useState } from "react";
// import { manageMarksheetColumns, ManageMarksheetType } from "../tables/manage-marksheet/manage-marksheet-column";
// import { DataTable } from "../ui/data-table";
// // import { ColumnDef } from "@tanstack/react-table";
// import { CustomPaginationState } from "../settings/SettingsContent";
// import { useQuery } from "@tanstack/react-query";

import { fetchMarksheetLogs } from "@/services/marksheet-apis";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "../ui/data-table";
import { marksheetLogsColumns } from "../tables/users/marksheet-log";
import { CustomPaginationState } from "../settings/SettingsContent";
import { useState } from "react";
import { MarksheetLog } from "@/types/academics/marksheet";

// import { fetchMarksheetLogs } from "@/services/marksheet-apis";
// import { useQuery } from "@tanstack/react-query";

// export default function AllActivities() {
//   const [data, setData] = useState<ManageMarksheetType[]>([]);
//   const [searchText, setSearchText] = useState("");
//   const [dataLength, setDataLength] = useState<number>(0);

//   const [pagination, setPagination] = useState<CustomPaginationState>({
//     pageIndex: 0, // TanStack Table is 0-based
//     pageSize: 10,
//     totalElements: 0,
//     totalPages: 1,
//   });

//   useEffect(() => {
//     setPagination({
//       pageIndex: 0, // TanStack Table is 0-based
//       pageSize: 10,
//       totalElements: 0,
//       totalPages: 1,
//     });
//   }, []);

//   const { isLoading: isFetchingDefault } = useQuery({
//     queryKey: [activeSetting.label, { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
//     queryFn: async () => {
//       const { data } = await fetchData({
//         activeSetting,
//         page: pagination.pageIndex + 1,
//         pageSize: pagination.pageSize,
//       });
//       console.log(data);

//       const { content, page, pageSize, totalElements, totalPages } = data.payload;

//       setData(content || []);

//       setDataLength(content.length);

//       console.log({ pageIndex: page, pageSize, totalElements, totalPages });

//       setPagination((prev) => ({ ...prev, totalElements, totalPages }));

//       return content;
//     },
//     enabled: searchText.trim() == "",
//   });

//   // Fetch the filtered data using React Query
//   const { isFetching: isFetchingSearch, refetch } = useQuery({
//     queryKey: ["users", pagination.pageIndex, pagination.pageSize, searchText, dataLength], // Query key with pagination and filter
//     queryFn: async () => {
//       if (searchText.trim() !== "") {
//         const data = await getSearchedUsers(
//           pagination.pageIndex + 1,
//           pagination.pageSize,
//           searchText.trim().toLowerCase(),
//         );

//         console.log("while searching:", data);
//         const { content, page, totalElements, totalPages } = data.payload;

//         setPagination((prev) => ({ ...prev, pageIndex: page - 1, totalElements, totalPages }));

//         setData(content);

//         setDataLength(content.length);

//         return content;
//       }
//     }, // Query function with page, pageSize, and search text
//     enabled: false,
//   });

//   return (
//     <div>
//       AllActivities
//       <DataTable
//         isLoading={false}
//         data={[]}
//         searchText={""}
//         setSearchText={setSearchText}
//         columns={manageMarksheetColumns}
//         pagination={pagination}
//         setPagination={setPagination}
//         setDataLength={setDataLength}
//       />
//     </div>
//   );
// }

export default function AllActivities() {
  const [searchText, setSearchText] = useState("");
  const setDataLength = useState<number>(0)[1];
  const [data, setData] = useState<MarksheetLog[]>([]);

  const [pagination, setPagination] = useState<CustomPaginationState>({
    pageIndex: 0, // TanStack Table is 0-based
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });

  const { isFetching: isFetchingDefault, refetch } = useQuery<MarksheetLog[], Error>({
    queryKey: ["marksheet-logs"],
    queryFn: async () => {
      const response = await fetchMarksheetLogs(1, 10, searchText);
      console.log("in query, ", response.payload);

      setData(response.payload);
      return response.payload as MarksheetLog[];
    },
    enabled: true,
  });

  console.log(data);

  return (
    <DataTable
      isLoading={isFetchingDefault}
      data={data}
      searchText={searchText}
      setSearchText={setSearchText}
      columns={marksheetLogsColumns}
      pagination={pagination}
      setPagination={setPagination}
      setDataLength={setDataLength}
      refetch={refetch}
    />
  );
}
