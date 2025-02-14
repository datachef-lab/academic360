import { Printer, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const overdueBooks = [
  { title: "Book A", dueDate: "2024-02-01", overdueDays: 10, fine: 100 },
  { title: "Book B", dueDate: "2024-02-05", overdueDays: 6, fine: 60 },
];

const borrowingHistory = [
  { title: "Book X", borrowedDate: "2024-01-10", dueDate: "2024-01-25", returnDate: "2024-01-24", status: "Returned on time" },
  { title: "Book Y", borrowedDate: "2023-12-15", dueDate: "2024-01-01", returnDate: "2024-01-05", status: "Returned late" },
];

const fineChartData = [
  { name: "Book A", fine: 100 },
  { name: "Book B", fine: 60 },
];

const LibReport = () => {
  return (
    <div className="p-6 p space-y-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="p-4 pl-6 shadow-lg bg-white dark:bg-gray-800 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Fine Summary</h2>
        <p className="text-lg font-semibold flex items-center gap-2">
          Total Outstanding Fine: ₹160 <AlertCircle className="text-red-500" />
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">₹10 per day after the due date.</p>
        <p className="text-sm text-red-500 flex items-center gap-2">
          Borrowing privileges may be suspended if not paid within 30 days. <XCircle className="text-red-500" />
        </p>
        
        <h3 className="text-lg font-semibold mt-4">Fine Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full lg:max-w-[30%] border-collapse border border-gray-300 dark:border-gray-700 mt-2">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="p-2 border border-gray-300 dark:border-gray-700">Book</th>
                <th className="p-2 border border-gray-300 dark:border-gray-700">Fine Amount</th>
              </tr>
            </thead>
            <tbody>
              {fineChartData.map((book, index) => (
                <tr key={index} className="border border-gray-300 dark:border-gray-700">
                  <td className="p-2 border border-gray-300 dark:border-gray-700">{book.name}</td>
                  <td className={`p-2 border border-gray-300 dark:border-gray-700 flex items-center gap-2 ${book.fine > 80 ? 'text-red-500' : book.fine > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                    ₹{book.fine} {book.fine > 80 ? <XCircle className="text-red-500" /> : book.fine > 50 ? <AlertCircle className="text-yellow-500" /> : <CheckCircle className="text-green-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-4 shadow-lg bg-white dark:bg-gray-800 rounded-2xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Overdue Books List</h2>
        <table className="w-full lg:max-w-[70%] border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 border border-gray-300 dark:border-gray-700">Title</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Due Date</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Days Overdue</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Fine</th>
            </tr>
          </thead>
          <tbody>
            {overdueBooks.map((book, index) => (
              <tr key={index} className="border border-gray-300 dark:border-gray-700">
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.title}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.dueDate}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.overdueDays}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">₹{book.fine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 shadow-lg bg-white dark:bg-gray-800 rounded-2xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Borrowing History</h2>
        <table className="w-full lg:max-w-[70%] border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 border border-gray-300 dark:border-gray-700">Title</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Borrowed Date</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Due Date</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Return Date</th>
              <th className="p-2 border border-gray-300 dark:border-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {borrowingHistory.map((book, index) => (
              <tr key={index} className="border border-gray-300 dark:border-gray-700">
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.title}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.borrowedDate}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.dueDate}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.returnDate}</td>
                <td className="p-2 border border-gray-300 dark:border-gray-700">{book.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-wrap gap-4">
        
        <button onClick={()=>{window.print()}} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Printer size={18} /> Print 
        </button>
      </div>
    </div>
  );
};

export default LibReport;