// import React, { useContext } from "react";
// import { Link, useParams } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FileText } from "lucide-react";

// import { Card, CardContent } from "@/components/ui/card";
// import FileUpload from "@/components/manage-marksheet/FileUpload";

// import { ThemeProviderContext } from "@/providers/ThemeProvider";

// import AddMarksheetButton from "./AddMarksheetButton";

// // interface ActivityLog {
// //   date: string;
// //   activity: string;
// // }

// const tabs = [
//   { url: "/home/manage-marksheet", label: "All Activities", isActive: true },
//   { url: "/home/manage-marksheet/CCF", label: "CCF", isActive: false },
//   { url: "/home/manage-marksheet/CBCS", label: "CBCS", isActive: false },
// ];

// export default function ManageMarksheetWrapper({ children }: { children: React.ReactNode }) {
//   const { framework } = useParams();
//   const { theme } = useContext(ThemeProviderContext);

//   const activeTab = framework || "All Activities";

//   return (
//     <div className="flex flex-col gap-6">
//       <Card className="shadow-lg border rounded-2xl">
//         <CardContent className="p-6 flex flex-col gap-6">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//             className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4"
//           >
//             <div className="grid grid-cols-[auto_1fr] items-center gap-4 drop-shadow-xl">
//               <motion.div
//                 whileHover={{ scale: 1.05, rotate: -5 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
//               >
//                 <FileText className="h-8 w-8 drop-shadow-xl text-white" />
//               </motion.div>
//               <div>
//                 <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Marksheet</h2>
//                 <p className="text-sm text-purple-600 font-medium">Upload and manage your marksheets</p>
//               </div>
//             </div>

//             <motion.div
//               initial={{ scaleX: 0 }}
//               animate={{ scaleX: 1 }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
//             />
//           </motion.div>

//           <div className="flex justify-between">
//             <FileUpload />
//             <AddMarksheetButton />
//           </div>
//           <ul className="flex gap-5 my-5 border-b">
//             {tabs.map((tab) => (
//               <li
//                 key={tab.label}
//                 className={`min-w-[100px] pb-2 border-b border-b-transparent flex justify-center ${
//                   activeTab === tab.label ? "border-b-slate-400" : ""
//                 }`}
//               >
//                 <Link to={tab.url} className={`${theme === "light" ? "text-black" : "text-white"} p-0`}>
//                   {tab.label}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//           {children}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { motion } from "framer-motion";
import { FileText } from "lucide-react";

import FileUpload from "@/components/manage-marksheet/FileUpload";
import AddMarksheetButton from "./AddMarksheetButton";

export default function ManageMarksheetWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-white">
      <div className="max-w-auto mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 ">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
            >
              <FileText className="h-8 w-8 drop-shadow-lg text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Add Marksheet</h2>
              <p className="text-sm text-purple-600 font-medium">Upload and manage your marksheets</p>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
          <FileUpload />
          <div className="flex justify-end">
            <AddMarksheetButton />
          </div>
        </div>
      </div>
    </div>
  );
}
