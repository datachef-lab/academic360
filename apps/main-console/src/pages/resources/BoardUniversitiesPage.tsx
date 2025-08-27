// import { Button } from "@/components/ui/button";
// import { DataTable } from "@/components/ui/data-table";
// import { Input } from "@/components/ui/input";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { motion } from "framer-motion";
// import { Home } from "lucide-react";
// import { useEffect, useState } from "react";
// import { CustomPaginationState, SettingsRow } from ".";
// import { ColumnDef } from "@tanstack/react-table";

// export default function BoardUniversitiesPage() {
//       const [searchText, setSearchText] = useState("");
//       const queryClient = useQueryClient();
//       const [modalState, setModalState] = useState<{
//         isOpen: boolean;
//         type: string;
//         action: string;
//         settingType: string;
//         editData?: SettingsRow;
//         editId?: number;
//       }>({
//         isOpen: false,
//         type: "",
//         action: "",
//         settingType: "",
//         editData: undefined,
//         editId: undefined,
//       });
    
//       const [data, setData] = useState<SettingsRow[]>([]);
//       const [dataLength, setDataLength] = useState<number>(0);
    
//       const [columns, setColumns] = useState<ColumnDef<unknown, unknown>[]>([]);
//       const [pagination, setPagination] = useState<CustomPaginationState>({
//         pageIndex: 0, // TanStack Table is 0-based
//         pageSize: 10,
//         totalElements: 0,
//         totalPages: 1,
//       });
    
//       useEffect(() => {
//         setPagination({
//           pageIndex: 0, // TanStack Table is 0-based
//           pageSize: 10,
//           totalElements: 0,
//           totalPages: 1,
//         });
//       }, []);
    
//     //   const { isLoading: isFetchingDefault } = useQuery({
//     //     queryKey: ["board-universities", { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
//     //     queryFn: async () => {
//     //       const { data, columns: tableCol } = await fetchData({
//     //         activeSetting,
//     //         page: pagination.pageIndex + 1,
//     //         pageSize: pagination.pageSize,
//     //         isAdmin: "board-universities" === "All Users" ? true : false,
//     //       }, handleEditRow);
//     //       console.log(data);
//     //       setColumns(tableCol as ColumnDef<unknown, unknown>[]);
    
//     //       // Handle different response structures
//     //       let content: SettingsRow[] = [], page: number, pageSize: number, totalElements: number, totalPages: number;
          
//     //       if (data.payload && Array.isArray(data.payload)) {
//     //         // Direct array response (like categories)
//     //         content = data.payload;
//     //         page = 1;
//     //         pageSize = content.length;
//     //         totalElements = content.length;
//     //         totalPages = 1;
//     //       } else if (data.payload && data.payload.content) {
//     //         // Paginated response with content property
//     //         ({ content, page, pageSize, totalElements, totalPages } = data.payload);
//     //       } else {
//     //         // Fallback
//     //         content = [];
//     //         page = 1;
//     //         pageSize = 10;
//     //         totalElements = 0;
//     //         totalPages = 1;
//     //       }
    
//     //       setData(content as SettingsRow[]);
//     //       setDataLength(content.length);
//     //       console.log({ pageIndex: page, pageSize, totalElements, totalPages });
//     //       setPagination((prev) => ({ ...prev, totalElements, totalPages }));
    
//     //       return content;
//     //     },
//     //     enabled: searchText.trim() == "",
//     //   });
    
//       // Fetch the filtered data using React Query
//       const { isFetching: isFetchingSearch, refetch } = useQuery({
//         queryKey: ["users", pagination.pageIndex, pagination.pageSize, searchText, dataLength], // Query key with pagination and filter
//         queryFn: async () => {
//           if (searchText.trim() !== "") {
//             const data = await getSearchedUsers(
//               pagination.pageIndex + 1,
//               pagination.pageSize,
//               searchText.trim().toLowerCase(),
//             );
    
//             console.log("while searching:", data);
//             const { content, page, totalElements, totalPages } = data.payload;
    
//             setPagination((prev) => ({ ...prev, pageIndex: page - 1, totalElements, totalPages }));
    
//             setData(content as SettingsRow[]);
    
//             setDataLength(content.length);
    
//             return content;
//           }
//         }, // Query function with page, pageSize, and search text
//         enabled: false,
//       });




//   return (
//     <div className="p-4">
//       {/* Page Header */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4 bg-purple-500 rounded-t-lg"
//       >
//         <div className="grid grid-cols-[auto_1fr] items-center gap-4">
//           <motion.div
//             whileHover={{ scale: 1.05, rotate: -5 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl shadow-xl"
//           >
//             <Home className="h-8 w-8 drop-shadow-xl text-white" />
//           </motion.div>
//           <div>
//             <h2 className="text-2xl md:text-3xl font-bold text-white">Board Universities & Subjects</h2>
//             <p className="text-sm text-white/80 font-medium">
//               Customize your preferences and manage configurations effortlessly.
//             </p>
//           </div>
//         </div>
//         <div className="flex gap-2 justify-end">
//           <Button variant="outline">Bulk Uploda</Button>
//           <Button variant="outline">Download Template</Button>
//           <Button variant="outline">Add</Button>
//         </div>

//         <motion.div
//           initial={{ scaleX: 0 }}
//           animate={{ scaleX: 1 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//           className="h-1 bg-gradient-to-r mt-2 from-white/40 via-white/60 to-white/40 rounded-full origin-left col-span-full"
//         />
//       </motion.div>

//       {/* Tools */}
//       <div className="flex justify-between py-4">
//         <Input type="text" placeholder="Search" className="w-1/3" />
//         <Button type="button" className="bg-green-800 hover:bg-green-900">
//           Download
//         </Button>
//       </div>

//       {/* Table */}
//       <DataTable
//         isLoading={isFetchingDefault || isFetchingSearch}
//         data={data}
//         // optionalTools={optionalTools}
//         searchText={searchText}
//         setSearchText={setSearchText}
//         columns={columns}
//         pagination={pagination}
//         setPagination={setPagination}
//         setDataLength={setDataLength}
//         refetch={refetch as (options?: RefetchOptions) => Promise<QueryObserverResult<unknown[] | undefined, Error>>}
//       />
//     </div>
//   );
// }




export default function BoardUniversitiesPage() {
  return (
    <div>BoardUniversitiesPage</div>
  )
}
