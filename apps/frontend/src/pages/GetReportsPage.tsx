// import React, { useEffect, useState,useRef } from "react";
// import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
// import { ReportColumns } from "@/components/reports/columns";
// import { DataTable } from "@/components/reports/DataTable";
// import { getAllReports } from "@/services/student-apis";
// import { useQuery } from "@tanstack/react-query";
// import { useReportStore } from "@/components/globals/useReportStore";
// import useDebounce from "@/components/Hooks/useDebounce";

// const Page: React.FC = () => {
//   const { filters, setFilteredData, filteredData } = useReportStore();
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 10,
//   });
// const debouncePagination= useDebounce(pagination, 400);
// const lastPageCountRef = useRef(0); 


//   const { data ,isLoading} = useQuery({
//     queryKey: ["reports", filters, debouncePagination],
//     queryFn: () =>
//       getAllReports({
//         stream: filters.stream ?? undefined,
//         year: filters.year ?? undefined,
//         framework: filters.framework ?? undefined,
//         semester: filters.semester??undefined,
//         // showFailedOnly: filters.showFailedOnly,
//         page: debouncePagination.pageIndex + 1,
//         pageSize: debouncePagination.pageSize,
//       }),
//      placeholderData: (prevData) => prevData,
//       staleTime: 6000,
//       // refetchOnWindowFocus: false,
//   });

//   useEffect(() => {
//     if (data) {
//       console.log("Data fetched:", data.payload.content);
//       setFilteredData(data.payload.content);
//       lastPageCountRef.current = data.payload.totalPages; 
//     }
   
//   }, [data, setFilteredData]);

//   return (
//     <div className="flex flex-col items-center justify-center">
//       <div className=" mt-10 border mx-auto w-full ">
//         {" "}
//         <FilterAndExportComponent />
//       </div>
//       <div className=" mx-auto max-w-[1260px]  p-2"> 
//         <DataTable
//           isLoading={isLoading}
//           columns={ReportColumns}
//           data={filteredData || []}
//           pageCount={lastPageCountRef.current}
//           pagination={pagination}
//           onPaginationChange={setPagination}
//         />
//       </div>
//     </div>
//   );
// };

// export default Page;
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { ReportColumns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";
import { getAllReports } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/components/globals/useReportStore";
import useDebounce from "@/components/Hooks/useDebounce";
import { BarChart2, BookOpen, Filter } from "lucide-react";

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
      className="   min-h-screen flex flex-col items-center justify-center"
    >
      <div className="max-w-7xl mx-auto">
      <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10 ml-2 mb-10 text-center sm:text-left"
        >
          <div className="flex items-center justify-center sm:justify-start gap-4 mb-3">
            <BarChart2 className="h-10 w-10 text-indigo-600" strokeWidth={1.5} />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Student Report
            </h1>
          </div>
          <p className=" px-3 text-lg text-indigo-700 flex items-center justify-center sm:justify-start gap-2">
            <BookOpen className="h-5 w-5" />
            Analyze and export comprehensive student performance data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white border rounded-xl shadow-lg p-6 mb-8"
        >
           <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-indigo-800">Filter Options</h2>
          </div>
          <FilterAndExportComponent />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mx-auto max-w-[1260px]  p-2"
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

// import React, { useEffect, useState, useRef } from "react";
// import { motion } from "framer-motion";
// import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
// import { ReportColumns } from "@/components/reports/columns";
// import { DataTable } from "@/components/reports/DataTable";
// import { getAllReports } from "@/services/student-apis";
// import { useQuery } from "@tanstack/react-query";
// import { useReportStore } from "@/components/globals/useReportStore";
// import useDebounce from "@/components/Hooks/useDebounce";
// import { FileText, BarChart2, Users, BookOpen, Download, Filter } from "lucide-react";

// const Page: React.FC = () => {
//   const { filters, setFilteredData, filteredData } = useReportStore();
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 10,
//   });
//   const debouncePagination = useDebounce(pagination, 400);
//   const lastPageCountRef = useRef(0);

//   const { data, isLoading } = useQuery({
//     queryKey: ["reports", filters, debouncePagination],
//     queryFn: () =>
//       getAllReports({
//         stream: filters.stream ?? undefined,
//         year: filters.year ?? undefined,
//         framework: filters.framework ?? undefined,
//         semester: filters.semester ?? undefined,
//         page: debouncePagination.pageIndex + 1,
//         pageSize: debouncePagination.pageSize,
//       }),
//     placeholderData: (prevData) => prevData,
//     staleTime: 6000,
//   });

//   useEffect(() => {
//     if (data) {
//       setFilteredData(data.payload.content);
//       lastPageCountRef.current = data.payload.totalPages;
//     }
//   }, [data, setFilteredData]);

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//       className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8"
//     >
//       <div className="max-w-7xl mx-auto">
//         <motion.div
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="mb-10 text-center sm:text-left"
//         >
//           <div className="flex items-center justify-center sm:justify-start gap-4 mb-3">
//             <BarChart2 className="h-10 w-10 text-indigo-600" strokeWidth={1.5} />
//             <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//               Student Performance Dashboard
//             </h1>
//           </div>
//           <p className="text-lg text-indigo-700 flex items-center justify-center sm:justify-start gap-2">
//             <BookOpen className="h-5 w-5" />
//             Analyze and export comprehensive student performance data
//           </p>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2, duration: 0.5 }}
//           className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-indigo-100"
//         >
//           <div className="flex items-center gap-3 mb-4">
//             <Filter className="h-5 w-5 text-indigo-600" />
//             <h2 className="text-xl font-semibold text-indigo-800">Filter Options</h2>
//           </div>
//           <FilterAndExportComponent />
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.4, duration: 0.5 }}
//           className="bg-white rounded-xl shadow-lg overflow-hidden border border-indigo-100"
//         >
//           <div className="p-5 border-b border-indigo-100 bg-indigo-50">
//             <div className="flex items-center gap-3">
//               <FileText className="h-5 w-5 text-indigo-600" />
//               <h2 className="text-xl font-semibold text-indigo-800">Performance Reports</h2>
//               {isLoading && (
//                 <motion.span 
//                   className="text-sm text-indigo-500 ml-2"
//                   animate={{ opacity: [0.6, 1, 0.6] }}
//                   transition={{ duration: 1.5, repeat: Infinity }}
//                 >
//                   Loading...
//                 </motion.span>
//               )}
//             </div>
//           </div>
//           <DataTable
//             isLoading={isLoading}
//             columns={ReportColumns}
//             data={filteredData || []}
//             pageCount={lastPageCountRef.current}
//             pagination={pagination}
//             onPaginationChange={setPagination}
//           />
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// };

// export default Page;