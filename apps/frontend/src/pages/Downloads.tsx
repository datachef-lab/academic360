

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChipTabs } from '@/components/ui/chipTabs';
import StudentDownloads from '@/components/downloads/StudentDownloads';
import MarksheetDownloads from '@/components/downloads/MarksheetDownloads';

const Downloads: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('Students');

  const tabs = ['Students', 'Marksheet'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-2 sm:p-2 lg:p-4">
     
      <div className="max-w-auto mx-auto space-y-6">
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

     
        <div className="grid grid-cols-1 space-y-1   w-full">
     
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
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

         
          <div
           
            className=""
          >
            {selectedTab === 'Students' ? <StudentDownloads /> : <MarksheetDownloads />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;