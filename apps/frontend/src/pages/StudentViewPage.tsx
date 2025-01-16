// import React from "react";
// import { motion } from "framer-motion"; // Import from Framer Motion
// import { Bookmark } from "lucide-react"; // Import Bookmark from lucide-react

// const StudentViewPage = () => {
//   const fieldsetVariants = {
//     hidden: { opacity: 0, y: 50 },
//     visible: (index) => ({
//       opacity: 1,
//       y: 0,
//       transition: { delay: index * 0.2, duration: 0.6, ease: "easeInOut" },
//     }),
//   };

//   const fieldsets = Array(5).fill(0); // Simulating 5 fieldsets

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-6">
//       {fieldsets.map((_, index) => (
//         <motion.fieldset
//           key={index}
//           custom={index}
//           initial="hidden"
//           animate="visible"
//           variants={fieldsetVariants}
//           className="max-w-[500px] w-full border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
//         >
//           <legend>
//             <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
//               <Bookmark size={21} />
//             </div>
//           </legend>
//           <p className="mt-4 text-gray-700">
//             Lorem ipsum dolor sit amet, consectetur adipiscing elit.
//           </p>
//         </motion.fieldset>
//       ))}
//     </div>
//   );
// };

// export default StudentViewPage;
import React from "react";
import { motion, Variants } from "framer-motion"; // Import from Framer Motion
import { Bookmark } from "lucide-react"; // Import Bookmark from lucide-react
import { Component } from "./AttendaceChart";

const StudentViewPage: React.FC = () => {
  // Define the type for variants
  const fieldsetVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.2, duration: 0.6, ease: "easeInOut" },
    }),
  };

  return (
    <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6 p-6">
      <motion.fieldset
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fieldsetVariants}
        className="max-w-[700px] w-full border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
      >
        <legend>
          <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
            <Bookmark size={21} />
          </div>
        </legend>
        <p className="mt-4 text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </motion.fieldset>

      <motion.fieldset
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fieldsetVariants}
        className="max-w-[400px] w-full border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
      >
        <legend>
          <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
            <Bookmark size={21} />
          </div>
        </legend>
        <p className="mt-4 text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </motion.fieldset>

      <motion.fieldset
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fieldsetVariants}
        className=" border border-gray-900 rounded-lg p-4 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
      >
        <legend>
          <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
            <Bookmark size={21} />
          </div>
        </legend>
        <Component/>
        
      </motion.fieldset>

      <motion.fieldset
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fieldsetVariants}
        className=" border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
      >
        <legend>
          <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
            <Bookmark size={21} />
          </div>
        </legend>
        <p className="mt-4 text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </motion.fieldset>

      <motion.fieldset
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fieldsetVariants}
        className="  border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
      >
        <legend>
          <div className="text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
            <Bookmark size={21} />
          </div>
        </legend>
        <p className="mt-4 text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </motion.fieldset>
    </div>
  );
};

export default StudentViewPage;
