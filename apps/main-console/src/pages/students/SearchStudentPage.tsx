import React from 'react';
import SearchStudent from './SearchStudent';
import { motion } from "framer-motion";
import { UserSearch } from 'lucide-react';


const SearchStudentPage: React.FC = () => {
  return (
    <div className="grid grid-rows-[auto_1fr] min-h-[80vh] bg-gradient-to-br from-purple-50 to-white rounded-sm shadow-xl overflow-hidden">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-8 "
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
              >
                <UserSearch className="h- w- drop-shadow-xl text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Search Student</h2>
                <p className="text-sm text-purple-600 font-medium">Find and manage student records</p>
              </div>
            </div>
    
           
    
          <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
            />
          </motion.div>
    
          {/* Table Section */}
          <div className="grid grid-rows-[1fr_auto] p-4 sm:p-6  ">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden rounded-xl bg-transparent "
            >
             <SearchStudent></SearchStudent>
            </motion.div>
          </div>
        </div>
  );
};

export default SearchStudentPage;