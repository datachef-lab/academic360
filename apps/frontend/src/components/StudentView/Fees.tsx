

import React from 'react';

// interface FeesProps {
//   feeAmount: number;
//   dueDate: string;
// }

const Fees: React.FC= () => {
  return (
    <div className="max-w-sm mx-auto h-full bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
      <div className='w-full'><div className="text-center">
        <h2 className="text-3xl font-semibold text-red-500">Payment Due</h2>
      </div>
      <div className="mt-14 text-center text-gray-700 space-y-2">
        <p >
          <span className="font-bold text-4xl text-red-500">₹20000</span> 
         
        </p>
        
      </div>
      <div className="mt-12 ml-10 flex-col items-center justify-center">
        <p className="text-xs  text-gray-600">Last date for payment  <span className="font-bold text-xs text-red-600">31 Jan 2025</span> </p>
       
        </div>
       
      </div>
      <p className="text-xs text-gray-600">Avoid late fees, pay now.</p>
      <button className="w-full bg-red-500 text-white py-2 rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
        Pay Now
      </button>
    </div>
  );
};

export default Fees;
