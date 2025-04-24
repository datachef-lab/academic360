import React from "react";
import { BookOpen, Clock, AlertTriangle, Archive } from "lucide-react";
import { DataTable } from "../reports/DataTable";
import { IssuedBookColumns } from "../tables/resources/IssuedBookColumn";
import { IssueBookData } from "@/lib/Data";





const IssueRetun: React.FC = () => {
  const stats = [
    { title: "Books Issued", value: 3, icon: <BookOpen size={28} className="text-blue-500" />, bgColor: "bg-blue-600", gradient: "bg-gradient-to-r from-blue-400 to-blue-800" },
    { title: "Books Due Soon", value: 1, icon: <Clock size={28} className="text-yellow-500" />, bgColor: "bg-yellow-500", gradient: "bg-gradient-to-r from-yellow-400 to-yellow-500" },
    { title: "Overdue & Fine", value: "₹110", icon: <AlertTriangle size={28} className="text-red-500" />, bgColor: "bg-red-600", gradient: "bg-gradient-to-r from-red-400 to-red-800" },
    { title: "Total Borrowed", value: 15, icon: <Archive size={28} className="text-green-500" />, bgColor: "bg-green-600", gradient: "bg-gradient-to-r from-green-400 to-green-800" },
  ];


  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index}
          className={`relative overflow-hidden rounded-2xl shadow-lg p-5 flex items-center space-x-4 transition-transform transform hover:scale-105 ${stat.bgColor}`}
        >        
          <div className={`absolute inset-0 ${stat.gradient} opacity-20 blur-lg`}></div>
          <div className="relative p-4 bg-white rounded-full shadow-md">{stat.icon}</div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-white">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        </div>
      
        ))}
      </div>

   
      <div className=" p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Student Borrowed Books Record</h2>
      <DataTable 
        columns={IssuedBookColumns} 
        data={IssueBookData} 
        pageCount={10} 
        onPaginationChange={(page) => console.log("Page changed to:", page)} 
        pagination={{ pageIndex: 0, pageSize: 10 }} 
      ></DataTable>
        
      </div>
    </div>
  );
};

export default IssueRetun;
