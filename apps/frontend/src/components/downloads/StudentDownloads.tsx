import React from 'react';
import SearchStudent from '@/pages/SearchStudent';
import FilterAndExportComponent from '@/components/reports/FilterAndExportComponent';
import { motion } from 'framer-motion';

const StudentDownloads: React.FC = () => {
  return (
           <div className="grid grid-cols-1   w-full ">
             {/* Filter Section - Full Width */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4, delay: 0.1 }}
               className="col-span-full"
             >
               <div className="p-4  ">
                 <FilterAndExportComponent />
               </div>
             </motion.div>
   
             {/* Search and Table Section - Full Width */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4, delay: 0.2 }}
               className="col-span-full "
             >
               <div className=" bg-transparent px-1  rounded-2xl drop-shadow-lg  ">
   
                 <SearchStudent />
               </div>
             </motion.div>
           </div>
  );
};

export default StudentDownloads; 