// import { useState } from "react";
// import { FaRupeeSign, FaCreditCard, FaGooglePay, FaFileDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// const finesData = [
//   { id: 1, title: "The Great Gatsby", dueDate: "2024-02-10", overdueDays: 3, amount: 30, status: "Unpaid" },
//   { id: 2, title: "Harry Potter", dueDate: "2024-02-15", overdueDays: 5, amount: 50, status: "Unpaid" },
//   { id: 3, title: "Data Structures", dueDate: "2024-02-12", overdueDays: 2, amount: 20, status: "Paid" },
// ];

// export default function LibFineManagement() {
//   const [fines, setFines] = useState(finesData);

//   const handlePayFine = (id: number) => {
//     setFines(fines.map(fine => (fine.id === id ? { ...fine, status: "Paid" } : fine)));
//   };

//   return (
//     <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center">
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">📚 Fine Management</h1>
//       <div className="w-full max-w-3xl">
//         {fines.map(fine => (
//           <Card key={fine.id} className="mb-4 p-4 shadow-lg rounded-xl bg-white">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold">{fine.title}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-gray-600">📅 Due Date: {fine.dueDate}</p>
//               <p className="text-gray-600">⏳ Overdue Days: {fine.overdueDays}</p>
//               <p className="text-gray-600 flex items-center">💰 Fine Amount: <FaRupeeSign className="ml-1" /> {fine.amount}</p>
//               <div className="mt-4 flex justify-between items-center">
//                 {fine.status === "Unpaid" ? (
//                   <Button className="bg-blue-500 hover:bg-blue-700 text-white flex items-center" onClick={() => handlePayFine(fine.id)}>
//                     <FaGooglePay className="mr-2" /> Pay Now
//                   </Button>
//                 ) : (
//                   <span className="text-green-600 flex items-center"><FaCheckCircle className="mr-2" /> Paid</span>
//                 )}
//                 <Button className="bg-gray-500 hover:bg-gray-700 text-white flex items-center">
//                   <FaFileDownload className="mr-2" /> Download Receipt
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, CreditCard, FileText } from "lucide-react";

const LibFineManagement: React.FC = () => {
  const [fineWaiverRequest, setFineWaiverRequest] = useState("");

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 border rounded-md border-gray-500 space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-600">📋 Fine Management</h1>
      
      <Tabs defaultValue="summary" className="  w-full">
      <TabsList className="grid border h-auto shadow-sm w-full grid-cols-3  ">
          <TabsTrigger value="summary"  >
            <FileText size={18} /> Summary
          </TabsTrigger>
          <TabsTrigger value="overdue" >
            <CheckCircle size={18} /> Overdue Books
          </TabsTrigger>
          <TabsTrigger value="payment" >
            <CreditCard size={18} /> Payment
          </TabsTrigger>
        </TabsList>

        {/* Fine Summary */}
        <TabsContent value="summary">
        <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="text-xl font-semibold">Total Outstanding Fine: ₹200</h2>
              <p className="text-gray-600  dark:text-gray-400">Breakdown by book:</p>
              <ul className="list-disc pl-6 dark:text-gray-300 text-gray-700">
                <li>Book 1 - ₹50 (5 days overdue)</li>
                <li>Book 2 - ₹150 (15 days overdue)</li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fine policy: ₹10 per day after due date.</p>
              <p className="text-gray-700 dark:text-gray-300">If fines are not paid within 30 days, further borrowing privileges may be suspended.</p>
              <p className="text-gray-700 dark:text-gray-300">For any queries, contact the library administration.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Books List */}
        <TabsContent value="overdue">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold">📅 Overdue Books</h2>
              <p className="text-gray-600">Books that have missed their due dates:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Book 1 - 5 days overdue</li>
                <li>Book 2 - 15 days overdue</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Online Fine Payment */}
        <TabsContent value="payment">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold">💳 Pay Fine Online</h2>
              <p className="text-gray-600">Choose a payment method:</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Button variant="outline">UPI</Button>
                <Button variant="outline">Debit/Credit Card</Button>
                <Button variant="outline">Net Banking</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fine Waiver Request */}
      <Card className="p-2">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xl font-semibold">💡 Request Fine Waiver</h2>
          <Input
            placeholder="Enter your reason..."
            value={fineWaiverRequest}
            onChange={(e) => setFineWaiverRequest(e.target.value)}
          />
          <Button className="w-full bg-blue-600 text-white">Submit Request</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibFineManagement;