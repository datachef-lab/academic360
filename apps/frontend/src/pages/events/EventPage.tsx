// import React from 'react';
// // import { motion } from 'framer-motion';
// // import { CalendarDays } from 'lucide-react';
// import Index from './commingSoonPage';

// const Event: React.FC = () => {
//   return (
//     // <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
//     //   <motion.div
//     //     initial={{ opacity: 0, y: 20 }}
//     //     animate={{ opacity: 1, y: 0 }}
//     //     transition={{ duration: 0.3 }}
//     //     className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4"
//     //   >
//     //     <div className="grid grid-cols-[auto_1fr] items-center gap-4">
//     //       <motion.div
//     //         whileHover={{ scale: 1.05, rotate: -5 }}
//     //         whileTap={{ scale: 0.95 }}
//     //         className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
//     //       >
//     //         <CalendarDays className="h-8 w-8 drop-shadow-xl text-white" />
//     //       </motion.div>
//     //       <div>
//     //         <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Events</h2>
//     //         <p className="text-sm text-purple-600 font-medium">
//     //           Explore upcoming events and important dates
//     //         </p>
//     //       </div>
//     //     </div>

//     //     <motion.div
//     //       initial={{ scaleX: 0 }}
//     //       animate={{ scaleX: 1 }}
//     //       transition={{ duration: 0.5, delay: 0.2 }}
//     //       className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
//     //     />
//     //   </motion.div>

//     //   {/* content */}
//     //   <div className="div"></div>
//     // </div>
//     <>
//        <Index></Index>
//     </>
//   );
// };

// export default Event;
import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

const EventPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
          >
            <CalendarDays className="h-8 w-8 drop-shadow-xl text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Events</h2>
            <p className="text-sm text-purple-600 font-medium">
              Explore upcoming events and important dates
            </p>
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
        />
      </motion.div>

      {/* content */}
      <div className="div"></div>
    </div>
  );
};

export default EventPage;
