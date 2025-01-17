// // import { motion } from "framer-motion";
// // import { useState } from "react";

// // const Fees: React.FC = () => {
// //   const [feesDue, setFeesDue] = useState<number | null>(null);

// //   const handleCheckFees = () => {
// //     // Toggle between showing fees or nil
// //     if (feesDue === null) {
// //       setFeesDue(1500); // Example of due fee
// //     } else {
// //       setFeesDue(null); // Reset to nil
// //     }
// //   };

// //   return (
// //     <motion.div
// //       initial={{ opacity: 0, y: 50 }}
// //       animate={{ opacity: 1, y: 0 }}
// //       transition={{ duration: 0.6, ease: "easeInOut" }}
// //       className="max-w-sm w-full border-4 border-gray-900 rounded-lg p-6 bg-blue-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
// //     >
// //       <div className="mb-4">
// //         <span className="text-2xl font-semibold text-blue-600 bg-white px-4 py-2 rounded-lg shadow-md">
// //           Fees
// //         </span>
// //       </div>
// //       <div className="mt-4 text-gray-700">
// //         <p>
// //           Fees Due:{" "}
// //           <span className={`font-bold ${feesDue === null ? "text-green-500" : "text-red-500"}`}>
// //             {feesDue === null ? "Nil" : `$${feesDue}`}
// //           </span>
// //         </p>
// //       </div>
// //       <button
// //         onClick={handleCheckFees}
// //         className="mt-6 w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
// //       >
// //         Check Fees
// //       </button>
// //     </motion.div>
// //   );
// // };

// // export default Fees;
// import React from 'react';

// interface FeesProps {
//   feeAmount: number;
//   dueDate: string;
// }

// const Fees: React.FC<FeesProps> = ()=> {
//   return (
//     <div className="max-w-sm mx-auto bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
//       <div className="text-center">
//         <h2 className="text-2xl font-semibold text-red-500">Fee Payment Due</h2>
//       </div>
//       <div className="text-center text-gray-700 space-y-2">
//         <p>
//           Your fee payment of <span className="font-bold text-red-600">₹20000</span> is due on{' '}
//           <span className="font-bold text-red-600">31 Jan 2025</span>.
//         </p>
//         <p>Please make your payment before the due date to avoid penalties.</p>
//       </div>
//       <button className="w-full bg-red-500 text-white py-2 rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
//         Pay Now
//       </button>
//     </div>
//   );
// };

// export default Fees;

import React from 'react';

// interface FeesProps {
//   feeAmount: number;
//   dueDate: string;
// }

const Fees: React.FC= () => {
  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-red-500">Payment Due</h2>
      </div>
      <div className="text-center text-gray-700 space-y-2">
        <p >
          <span className="font-bold text-2xl text-red-500">₹20000</span> 
         
        </p>
        
      </div>
      <div className="m-2 flex-col items-center justify-center">
        <p className="text-xs  text-gray-600">Last date for payment  <span className="font-bold text-xs text-red-600">31 Jan 2025</span> </p>
       
        </div>
        <p className="text-xs text-gray-600">Avoid late fees, pay now.</p>
      <button className="w-full bg-red-500 text-white py-2 rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
        Pay Now
      </button>
    </div>
  );
};

export default Fees;
