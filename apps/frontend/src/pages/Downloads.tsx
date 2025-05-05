// import React from 'react';
// import SearchStudent from './SearchStudent';
// import FilterAndExportComponent from '@/components/reports/FilterAndExportComponent';
// import { Download } from 'lucide-react';
// import { motion } from 'framer-motion';

// const Downloads: React.FC = () => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-2 sm:p-2 lg:p-4">
//       {/* crete tab switch and keep one default  */}
//       <div className="max-w-auto mx-auto space-y-6">
//         {/* Header Section */}

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-4 "
//         >
//           <div className="grid grid-cols-[auto_1fr] items-center gap-4 drop-shadow-xl">
//             <motion.div

//               whileHover={{ scale: 1.05, rotate: -5 }}
//               whileTap={{ scale: 0.95 }}
//               className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
//             >
//               <Download className="h-8 w-8 drop-shadow-xl text-white" />
//             </motion.div>
//             <div>
//               <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Downloads</h2>
//               <p className="text-sm text-purple-600 font-medium">Export your data in multiple formats</p>
//             </div>
//           </div>



//           <motion.div
//             initial={{ scaleX: 0 }}
//             animate={{ scaleX: 1 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
//           />
//         </motion.div>

//         {/* Main Content Grid */}
        // <div className="grid grid-cols-1 gap-6 p-2 w-full ">
        //   {/* Filter Section - Full Width */}
        //   <motion.div
        //     initial={{ opacity: 0, y: 20 }}
        //     animate={{ opacity: 1, y: 0 }}
        //     transition={{ duration: 0.5, delay: 0.2 }}
        //     className="col-span-full"
        //   >
        //     <div className="  ">
        //       <FilterAndExportComponent />
        //     </div>
        //   </motion.div>

        //   {/* Search and Table Section - Full Width */}
        //   <motion.div
        //     initial={{ opacity: 0, y: 20 }}
        //     animate={{ opacity: 1, y: 0 }}
        //     transition={{ duration: 0.5, delay: 0.3 }}
        //     className="col-span-full "
        //   >
        //     <div className=" bg-white/20 border border-red-500 rounded-2xl drop-shadow-xl  ">

        //       <SearchStudent />
        //     </div>
        //   </motion.div>
        // </div>
//       </div>
//     </div>
//   );
// };

// export default Downloads;

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChipTabs } from '@/components/ui/chipTabs';
import StudentDownloads from '@/components/downloads/StudentDownloads';
import ReportDownloads from '@/components/downloads/ReportDownloads';

const Downloads: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('Students');

  const tabs = ['Students', 'Reports'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-2 sm:p-2 lg:p-4">
      {/* crete tab switch and keep one default  */}
      <div className="max-w-auto mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-4"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 drop-shadow-xl">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
            >
              <Download className="h-8 w-8 drop-shadow-xl text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Downloads</h2>
              <p className="text-sm text-purple-600 font-medium">Export your data in multiple formats</p>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 space-y-1   w-full">
          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="drop-shadow-lg ml-8 "
          >
            <ChipTabs
              tabs={tabs}
              selected={selectedTab}
              setSelected={setSelectedTab}
              colorFrom="from-purple-500"
              colorTo="to-indigo-500"
              className=" rounded-2xl  "
              tabClassName="font-medium "
              activeTabClassName="shadow-lg"
              inactiveTabClassName="text-gray-600 hover:text-gray-700 hover:bg-purple-200"
            />
          </motion.div>

          {/* Tab Content */}
          <div
           
            className=""
          >
            {selectedTab === 'Students' ? <StudentDownloads /> : <ReportDownloads />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;