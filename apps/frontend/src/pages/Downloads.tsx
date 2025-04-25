import React from 'react';
import SearchStudent from './SearchStudentPage';
import FilterAndExportComponent from '@/components/reports/FilterAndExportComponent';
import { Download, FileText} from 'lucide-react';
import { motion } from 'framer-motion';

const Downloads: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-auto mx-auto space-y-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg shadow-md">
              <Download className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Downloads</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Export your data in multiple formats</span>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 w-full ">
          {/* Filter Section - Full Width */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-full"
          >
            <div className="  ">
              <FilterAndExportComponent />
            </div>
          </motion.div>

          {/* Search and Table Section - Full Width */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-full"
          >
            <div className="bg-white rounded-2xl shadow-lg px-4 py-2 ">
             
              <SearchStudent />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Downloads;