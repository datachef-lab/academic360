// import React from "react";
// import { UserDataTable } from "./DataTableTest";
// import { PaginationState } from "@tanstack/react-table";
// import { columns, User } from "./column";
// import { FileText, Download } from "lucide-react";

// interface CustomPaginationState extends PaginationState {
//   totalPages: number;
//   totalElements: number;
// }

// const ReportPage = () => {
//   const [pagination, setPagination] = React.useState<CustomPaginationState>({
//     pageIndex: 0,
//     pageSize: 5,
//     totalPages: 0,
//     totalElements: 0
//   });

//   const [searchText, setSearchText] = React.useState("");
//   const [, setDataLength] = React.useState<number>(0);

//   function useGetUsersQuery({ page, limit }: { page: number; limit: number }) {
//     const [data, setData] = React.useState<User[]>([]);
//     const [isLoading, setIsLoading] = React.useState<boolean>(true);
//     const [totalItems, setTotalItems] = React.useState<number>(0);
//     const [totalPages, setTotalPages] = React.useState<number>(0);
    
//     React.useEffect(() => {
//       setIsLoading(true);
//       // Simulate an API call
//       setTimeout(() => {
//         const allUsers: User[] = [
//           {
//             id: 1,
//             name: "Rithu Bhawanaj",
//             position: "Teacher",
//             email: "manager@edu.in",
//             contact: "Theory of Computation",
//             avatarColor: "#FFB74D",
//           },
//           {
//             id: 2,
//             name: "K Krishna shankar",
//             position: "Teacher",
//             email: "krish@ak.edu.in",
//             contact: "Design of Digital Systems",
//             avatarColor: "#4CAF50",
//           },
//           {
//             id: 3,
//             name: "Aparna Rajendran",
//             position: "Student",
//             email: "ritcha.23cs@students.edu.in",
//             contact: "23CS103",
//             avatarColor: "#00BCD4",
//           },
//           {
//             id: 4,
//             name: "Prabha SH",
//             position: "Student",
//             email: "prabha.23cs@students.edu.in",
//             contact: "23CS102",
//             avatarColor: "#E040FB",
//           },
//           {
//             id: 5,
//             name: "Vinod Noyal",
//             position: "Student",
//             email: "vinod@example.23cs@students.edu.in",
//             contact: "23CS112",
//             avatarColor: "#FFD700",
//           },
//           {
//             id: 6,
//             name: "Shashwath Raja",
//             position: "Student",
//             email: "shashwath.raja.23cs@students.edu.in",
//             contact: "23CS119",
//             avatarColor: "#7B68EE",
//           },
//           {
//             id: 7,
//             name: "Aarav",
//             position: "Student",
//             email: "aarav.23cs@students.edu.in",
//             contact: "Mtech(Networked[1])",
//             avatarColor: "#FF4444",
//           },
//         ];
  
//         const start = page * limit;
//         const end = start + limit;
//         const paginatedUsers = allUsers.slice(start, end);
    
//         setDataLength(allUsers.length);
//         setData(paginatedUsers);
//         setTotalItems(allUsers.length);
//         setTotalPages(Math.ceil(allUsers.length / limit));
//         setIsLoading(false);
//       }, 500); // Simulate network delay
//     }, [page, limit]);
  
//     return { data, isLoading, totalItems, totalPages };
//   }

//   const { data, isLoading } = useGetUsersQuery({
//     page: pagination.pageIndex,
//     limit: pagination.pageSize,
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
//       {/* Main Container */}
//       <div className="max-w-7xl mx-auto space-y-8">
//         {/* Header Card */}
//         <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100 transform transition-all hover:shadow-2xl">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-6">
//               <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-4 rounded-2xl shadow-lg">
//                 <FileText className="h-8 w-8" />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold text-gray-900 mb-2">Report Dashboard</h1>
//                 <p className="text-gray-500">View, manage and download your reports</p>
//               </div>
//             </div>
//             <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
//               <Download className="h-5 w-5" />
//               Export Report
//             </button>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
//           {/* Table Section */}
//           <div className="p-2">
//             <UserDataTable<User, unknown>
//               data={data || []}
//               isLoading={isLoading}
//               pagination={pagination}
//               setPagination={setPagination}
//               columns={columns}
//               searchText={searchText}
//               setSearchText={setSearchText}
//               setDataLength={setDataLength}
//               // eslint-disable-next-line @typescript-eslint/no-explicit-any
//               refetch={async () => ({ data: data } as any)}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReportPage;

import React from 'react';
import SearchStudent from './SearchStudent';
import { motion } from "framer-motion";
import { UserSearch } from 'lucide-react';


const SearchStudentPage: React.FC = () => {
  return (
    <div className="grid grid-rows-[auto_1fr] min-h-[80vh] bg-gradient-to-br from-teal-100 to-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-8 bg-white/80 backdrop-blur-sm"
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl shadow-lg"
              >
                <UserSearch className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Student Search</h2>
                <p className="text-sm text-teal-600 font-medium">Find and manage student records</p>
              </div>
            </div>
    
           
    
          <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-gradient-to-r mt-2 from-teal-400 via-teal-500 to-teal-400 rounded-full origin-left col-span-full"
            />
          </motion.div>
    
          {/* Table Section */}
          <div className="grid grid-rows-[1fr_auto] p-4 sm:p-6  bg-white/90 shadow-lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden rounded-xl "
            >
             <SearchStudent></SearchStudent>
            </motion.div>
          </div>
        </div>
  );
};

export default SearchStudentPage;