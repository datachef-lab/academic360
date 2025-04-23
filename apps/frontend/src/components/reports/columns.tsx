// // // import { ColumnDef } from "@tanstack/react-table";
// // // import { Report } from "./types";

// // // export const ReportColumns: ColumnDef<Report>[] = [
// // //   {
// // //     accessorKey: "id",
// // //     header: "ID",
// // //   },
// // //   {
// // //     accessorKey: "rollNumber",
// // //     header: "Roll No.",
// // //   },
// // //   {
// // //     accessorKey: "registrationNumber",
// // //     header: "Registration No.",
// // //   },
// // //   {
// // //     accessorKey: "uid",
// // //     header: "UID",
// // //   },
// // //   {
// // //     accessorKey: "name",
// // //     header: "Name",
// // //   },
// // //   {
// // //     accessorKey: "stream",
// // //     header: "Stream",
// // //   },
// // //   {
// // //     accessorKey: "framework",
// // //     header: "Framework",
// // //   },
// // //   {
// // //     accessorKey: "semester",
// // //     header: "Semester",
// // //   },
// // //   {
// // //     accessorKey: "year",
// // //     header: "Year",
// // //   },
// // //   {
// // //     accessorKey: "sgpa",
// // //     header: "SGPA",
// // //   },
// // //   {
// // //     accessorKey: "cgpa",
// // //     header: "CGPA",
// // //   },
// // //   {
// // //     accessorKey: "letterGrade",
// // //     header: "Grade",
// // //   },
// // //   {
// // //     accessorKey: "remarks",
// // //     header: "Remarks",
// // //   },

// // //   {
// // //     accessorKey: "totalFullMarks",
// // //     header: "Total Full Marks",
// // //   },
// // //   {
// // //     accessorKey: "totalObtainedMarks",
// // //     header: "Total Marks Obtained",
// // //   },
// // //   {
// // //     accessorKey: "totalCredit",
// // //     header: " Credit",
// // //   },
// // //   {
// // //     accessorKey: "status",
// // //     header: "Status",
// // //   },
// // //   {
// // //     accessorKey: "percentage",
// // //     header: "Percentage",
// // //   },
// // //   // {
// // //   //   accessorKey: "isFailed",
// // //   //   header: "Failed?",
// // //   //   cell: ({ row }) => (row.original.isFailed ? "Yes" : "No"),
// // //   // },
 
// // //   // {
// // //   //   accessorKey: "historicalStatus",
// // //   //   header: "Historical Status",
// // //   // },
// // // ];

// // import { ColumnDef } from "@tanstack/react-table";
// // import { Report } from "./types";
// // import { cn } from "@/lib/utils";

// // // // Badge helpers
// // // const statusBadge = (value: string) => {
// // //   const styles = {
// // //     "PASS": "bg-green-100 text-green-700",
// // //    "FAIL (Overall <30%)": "bg-red-100 text-red-700",
// // //     Pending: "bg-yellow-100 text-yellow-700",
// // //     Default: "bg-gray-100 text-gray-700",
// // //   };
// // //   return (
// // //     <span className={cn(
// // //       "px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm",
// // //       styles[value as keyof typeof styles] || styles.Default
// // //     )}>
// // //       {value}
// // //     </span>
// // //   );
// // // };

// // // const remarksBadge = (value: string) => {
// // //   const styles = {
// // //     // Excellent: "bg-emerald-100 text-emerald-800",
// // //     // Good: "bg-blue-100 text-blue-800",
// // //     "Semester Cleared": "bg-emerald-100 text-emerald-800",
// // //     "Semester not cleared": "bg-red-100 text-red-800",
// // //     Default: "bg-gray-100 text-gray-700",
// // //   };
// // //   return (
// // //     <span className={cn(
// // //       "px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm",
// // //       styles[value as keyof typeof styles] || styles.Default
// // //     )}>
// // //       {value}
// // //     </span>
// // //   );
// // // };

// // // const gradeBadge = (value: string) => {
// // //   const styles = {
// // //     A: "bg-green-200 text-green-900",
// // //     B: "bg-blue-200 text-blue-900",
// // //     C: "bg-yellow-200 text-yellow-900",
// // //     D: "bg-red-200 text-red-900",
// // //     F: "bg-gray-300 text-gray-900",

// // //     Default: "bg-gray-100 text-gray-700",
// // //   };
// // //   return (
// // //     <span className={cn(
// // //       "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase shadow",
// // //       styles[value as keyof typeof styles] || styles.Default
// // //     )}>
// // //       {value}
// // //     </span>
// // //   );
// // // };

// // // // Report Table Columns
// // // export const ReportColumns: ColumnDef<Report>[] = [
// // //   { accessorKey: "id", header: "ID" },
// // //   { accessorKey: "rollNumber", header: "Roll No." },
// // //   { accessorKey: "registrationNumber", header: "Registration No." },
// // //   { accessorKey: "uid", header: "UID" },
// // //   { accessorKey: "name", header: "Name" },
// // //   { accessorKey: "stream", header: "Stream" },
// // //   { accessorKey: "framework", header: "Framework" },
// // //   { accessorKey: "semester", header: "Semester" },
// // //   { accessorKey: "year", header: "Year" },
// // //   { accessorKey: "sgpa", header: "SGPA" },
// // //   { accessorKey: "cgpa", header: "CGPA" },
// // //   {
// // //     accessorKey: "letterGrade",
// // //     header: "Grade",
// // //     cell: ({ getValue }) => gradeBadge(getValue() as string),
// // //   },
// // //   {
// // //     accessorKey: "remarks",
// // //     header: "Remarks",
// // //     cell: ({ getValue }) => remarksBadge(getValue() as string),
// // //   },
// // //   { accessorKey: "totalFullMarks", header: "Total Full Marks" },
// // //   { accessorKey: "totalObtainedMarks", header: "Marks Obtained" },
// // //   { accessorKey: "totalCredit", header: "Credit" },
// // //   {
// // //     accessorKey: "status",
// // //     header: "Status",
// // //     cell: ({ getValue }) => statusBadge(getValue() as string),
// // //   },
// // //   { accessorKey: "percentage", header: "Percentage" },
// // // ];
// // // Badge helpers
// // const statusBadge = (value: string) => {
// //   const styles = {
// //     "PASS": "bg-green-100 text-green-700",
// //     "FAIL (Overall <30%)": "bg-red-100 text-red-700",
// //     "Pending": "bg-yellow-100 text-yellow-700",
// //     "Default": "bg-gray-100 text-gray-700",
// //   };
// //   return (
// //     <span className={cn(
// //       "px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm",
// //       styles[value as keyof typeof styles] || styles.Default
// //     )}>
// //       {value}
// //     </span>
// //   );
// // };



// // const gradeBadge = (value: string) => {
// //   const styles = {
// //     // Plus grades
// //     "A+": "bg-purple-100 text-purple-900 border border-purple-200",
// //     "B+": "bg-blue-100 text-blue-900 border border-blue-200",
// //     "C+": "bg-cyan-100 text-cyan-900 border border-cyan-200",
// //     "D+": "bg-teal-100 text-teal-900 border border-teal-200",
    
// //     // Regular grades
// //     "A": "bg-green-100 text-green-900 border border-green-200",
// //     "B": "bg-sky-100 text-sky-900 border border-sky-200",
// //     "C": "bg-yellow-100 text-yellow-900 border border-yellow-200",
// //     "D": "bg-orange-100 text-orange-900 border border-orange-200",
// //     "E": "bg-amber-100 text-amber-900 border border-amber-200",
    
// //     // Fail grades
// //     "F": "bg-red-100 text-red-900 border border-red-200",
// //     "F(TH)": "bg-red-200 text-red-900 border border-red-300",
    
// //     // Default
  
// //   };
  
// //   // Remove any whitespace from the grade value
// //   const gradeValue = value.trim();
  
// //   return (
// //     <span className={cn(
// //       "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight shadow-sm",
// //       styles[gradeValue as keyof typeof styles] 
// //     )}>
// //       {gradeValue}
// //     </span>
// //   );
// // };

// // // Report Table Columns
// // export const ReportColumns: ColumnDef<Report>[] = [
// //   { accessorKey: "id", header: "ID" },
// //   { accessorKey: "rollNumber", header: "Roll No." },
// //   { accessorKey: "registrationNumber", header: "Registration No." },
// //   { accessorKey: "uid", header: "UID" },
// //   { accessorKey: "name", header: "Name" },
// //   { accessorKey: "stream", header: "Stream" },
// //   { accessorKey: "framework", header: "Framework" },
// //   { accessorKey: "semester", header: "Semester" },
// //   { accessorKey: "year", header: "Year" },
// //   { accessorKey: "sgpa", header: "SGPA" },
// //   { accessorKey: "cgpa", header: "CGPA" },
// //   {
// //     accessorKey: "letterGrade",
// //     header: "Grade",
// //     cell: ({ getValue }) => gradeBadge(getValue() as string),
// //   },
// //   {
// //     accessorKey: "remarks",
// //     header: "Remarks",
   
// //   },
// //   { accessorKey: "totalFullMarks", header: "Total Full Marks" },
// //   { accessorKey: "totalObtainedMarks", header: "Marks Obtained" },
// //   { accessorKey: "totalCredit", header: "Credit" },
// //   {
// //     accessorKey: "status",
// //     header: "Status",
// //     cell: ({ getValue }) => statusBadge(getValue() as string),
// //   },
// //   { accessorKey: "percentage", header: "Percentage" },
// // ];

// import { ColumnDef } from "@tanstack/react-table";
// import { Badge } from "@/components/ui/badge";
// import { CheckCircle2, XCircle, Award, FileText, Calendar, User, BookOpen, Code2, GraduationCap } from "lucide-react";
// import { Report } from "./types";

// export const ReportColumns: ColumnDef<Report>[] = [
//   {
//     accessorKey: "id",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <FileText className="h-4 w-4" />
//         <span>ID</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium">
//         #{row.getValue("id")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "rollNumber",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>Roll No</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium">
//         {row.getValue("rollNumber")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "registrationNumber",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <User className="h-4 w-4" />
//         <span>Registration No.</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("registrationNumber")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "uid",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Calendar className="h-4 w-4" />
//         <span>UID</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("uid")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "name",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Calendar className="h-4 w-4" />
//         <span>Name</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("name")}
//       </div>
//     ),
//   },
  
//   {
//     accessorKey: "stream",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <GraduationCap className="h-4 w-4" />
//         <span>Stream</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const stream = row.getValue("stream") as string;
//       const streamStyles = {
//         "BSC": "bg-blue-100 text-blue-800",
//         "BCOM": "bg-purple-100 text-purple-800",
//         "BA": "bg-green-100 text-green-800",
//         "MA": "bg-amber-100 text-amber-800",
//       };
      
//       return (
//         <Badge variant={"outline"}
//           className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800"} font-medium border-transparent`}
//         >
//           {stream}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "framework",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Code2 className="h-4 w-4" />
//         <span>Framework</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("framework")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "year",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Code2 className="h-4 w-4" />
//         <span>Year</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("year")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "semester",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>Semester</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("semester")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "sgpa",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>SGPA</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("sgpa")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "cgpa",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>CGPA</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("cgpa")}
//       </div>
//     ),
//   },
  
//   {
//     accessorKey: "totalFullMarks",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>Total Full Marks</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("totalFullMarks")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "totalObtainedMarks",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>Total Marks Obtained</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("totalObtainedMarks")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "totalCredit",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <BookOpen className="h-4 w-4" />
//         <span>Credit</span>
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700">
//         {row.getValue("totalCredit")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "letterGrade",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Award className="h-4 w-4" />
//         <span>Grade</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const grade = row.getValue("letterGrade") as string;
//       const gradeStyles = {
//         "A++": "bg-purple-100 text-purple-800",
//         "A+": "bg-blue-100 text-blue-800",
//         "A": "bg-green-100 text-green-800",
//         "B+": "bg-teal-100 text-teal-800",
//         "B": "bg-cyan-100 text-cyan-800",
//         "C+": "bg-amber-100 text-amber-800",
//         "C": "bg-orange-100 text-orange-800",
//         "D+": "bg-yellow-100 text-yellow-800",
//         "D": "bg-lime-100 text-lime-800",
//         "E": "bg-pink-100 text-pink-800",
//         "F": "bg-red-100 text-red-800",
//         "F(TH)": "bg-red-200 text-red-900",
//       };
      
//       return (
//         <Badge  variant={"outline"} className={`${gradeStyles[grade as keyof typeof gradeStyles] || "bg-gray-100 text-gray-800"} border-transparent font-medium`}>
//           {grade}
//         </Badge>
//       );
//     },
//   },

//   {
//     accessorKey: "status",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <CheckCircle2 className="h-4 w-4" />
//         <span>Status</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const status = row.getValue("status") as string;
//       const isPass = status.includes("PASS");
      
//       return (
//         <Badge variant={"outline"} className={`${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}  border-transparent`}>
//           {isPass ? (
//             <CheckCircle2 className="h-4 w-4 mr-1" />
//           ) : (
//             <XCircle className="h-4 w-4 mr-1" />
//           )}
//           {status}
//         </Badge>
//       );
//     },
//   },
  
//   {
//     accessorKey: "percentage",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <Award className="h-4 w-4" />
//         <span>Percentage</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const score = row.getValue("percentage") as string;
//       const scoreColor = score >= "90.00%" ? "bg-purple-50 text-purple-700" :
//                        score >= "75.00%" ? "bg-blue-50 text-blue-700" :
//                        score >= "50.00%" ? "bg-green-50 text-green-700" :
//                        score >= "30.00%" ? "bg-amber-50 text-amber-700" :
//                        "bg-red-50 text-red-700";
      
//       return (
//         <Badge variant={"outline"} className={`${scoreColor} border-transparent p-2`}>
//           <Award className="h-4 w-4 mr-1" />
//           {score}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "remarks",
//     header: () => (
//       <div className="flex items-center gap-2 text-slate-800 font-semibold">
//         <FileText className="h-4 w-4" />
//         <span>Remarks</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const remarks = row.getValue("remarks") as string;
//       const isCritical = remarks?.includes("not") || remarks?.includes("re-exam");
      
//       return (
//         <div className={`max-w-[200px] truncate ${isCritical ? "text-rose-600 " : "text-green-600 "} font-medium`}>
//           {remarks}
//         </div>
//       );
//     },
//   },
// ];

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Award, Calendar, User, BookOpen, Code2, ArrowUpDown } from "lucide-react";
import { Report } from "./types";

export const ReportColumns: ColumnDef<Report>[] = [
  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <FileText className="h-4 w-4" />
  //       <span>ID</span>
  //       <ArrowUpDown className="h-4 w-4" />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="text-slate-700 font-medium">
  //       #{row.getValue("id")}
  //     </div>
  //   ),
  // },
  {
    accessorKey: "rollNumber",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>Roll No</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 font-medium">
        {row.getValue("rollNumber")}
      </div>
    ),
  },
  {
    accessorKey: "registrationNumber",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <User className="h-4 w-4" />
        <span>Registration No.</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 font-semibold">
        {row.getValue("registrationNumber")}
      </div>
    ),
  },
  // {
  //   accessorKey: "uid",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <Calendar className="h-4 w-4" />
  //       <span>UID</span>
  //       <ArrowUpDown className="h-4 w-4" />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="text-slate-700">
  //       {row.getValue("uid")}
  //     </div>
  //   ),
  // },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Calendar className="h-4 w-4" />
        <span>Name</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 font-semibold">
        {row.getValue("name")}
      </div>
    ),
  },
  // {
  //   accessorKey: "stream",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <GraduationCap className="h-4 w-4" />
  //       <span>Stream</span>
  //       <ArrowUpDown className="h-4 w-4" />
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const stream = row.getValue("stream") as string;
  //     const streamStyles = {
  //       "BSC": "bg-blue-100 text-blue-800",
  //       "BCOM": "bg-purple-100 text-purple-800",
  //       "BA": "bg-green-100 text-green-800",
  //       "MA": "bg-amber-100 text-amber-800",
  //     };
      
  //     return (
  //       <Badge variant={"outline"}
  //         className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800"} font-medium border-transparent`}
  //       >
  //         {stream}
  //       </Badge>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "framework",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <Code2 className="h-4 w-4" />
  //       <span>Framework</span>
  //       <ArrowUpDown className="h-4 w-4" />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="text-slate-700">
  //       {row.getValue("framework")}
  //     </div>
  //   ),
  // },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Code2 className="h-4 w-4" />
        <span>Year</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("year")}
      </div>
    ),
  },
  {
    accessorKey: "semester",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>Semester</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("semester")}
      </div>
    ),
  },
  {
    accessorKey: "sgpa",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>SGPA</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("sgpa")}
      </div>
    ),
  },
  {
    accessorKey: "cgpa",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>CGPA</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("cgpa")}
      </div>
    ),
  },
  {
    accessorKey: "totalFullMarks",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>Total Full Marks</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("totalFullMarks")}
      </div>
    ),
  },
  {
    accessorKey: "totalObtainedMarks",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>Total Marks Obtained</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("totalObtainedMarks")}
      </div>
    ),
  },
  {
    accessorKey: "totalCredit",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-4 w-4" />
        <span>Credit</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("totalCredit")}
      </div>
    ),
  },
  {
    accessorKey: "letterGrade",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Award className="h-4 w-4" />
        <span>Grade</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => {
      const grade = row.getValue("letterGrade") as string;
      const gradeStyles = {
        "A++": "bg-purple-100 text-purple-800",
        "A+": "bg-blue-100 text-blue-800",
        "A": "bg-green-100 text-green-800",
        "B+": "bg-teal-100 text-teal-800",
        "B": "bg-cyan-100 text-cyan-800",
        "C+": "bg-amber-100 text-amber-800",
        "C": "bg-orange-100 text-orange-800",
        "D+": "bg-yellow-100 text-yellow-800",
        "D": "bg-lime-100 text-lime-800",
        "E": "bg-pink-100 text-pink-800",
        "F": "bg-red-100 text-red-800",
        "F(TH)": "bg-red-200 text-red-900",
      };
      
      return (
        <Badge variant={"outline"} className={`${gradeStyles[grade as keyof typeof gradeStyles] || "bg-gray-100 text-gray-800"} border-transparent font-medium`}>
          {grade}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Status</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isPass = status.includes("PASS");
      
      return (
        <Badge variant={"outline"} className={`${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} border-transparent`}>
          {isPass ? (
            <CheckCircle2 className="h-4 w-4 mr-1" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "percentage",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Award className="h-4 w-4" />
        <span>Percentage</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => {
      const score = row.getValue("percentage") as string;
      const scoreColor = score >= "90.00%" ? "bg-purple-50 text-purple-700" :
                       score >= "75.00%" ? "bg-blue-50 text-blue-700" :
                       score >= "50.00%" ? "bg-green-50 text-green-700" :
                       score >= "30.00%" ? "bg-amber-50 text-amber-700" :
                       "bg-red-50 text-red-700";
      
      return (
        <Badge variant={"outline"} className={`${scoreColor} border-transparent p-2`}>
          <Award className="h-4 w-4 mr-1" />
          {score}
        </Badge>
      );
    },
  },
  // {
  //   accessorKey: "remarks",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <FileText className="h-4 w-4" />
  //       <span>Remarks</span>
  //       <ArrowUpDown className="h-4 w-4" />
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const remarks = row.getValue("remarks") as string;
  //     const isCritical = remarks?.includes("not") || remarks?.includes("re-exam");
      
  //     return (
  //       <div className={`max-w-[200px] truncate ${isCritical ? "text-rose-600 " : "text-green-600 "} font-medium`}>
  //         {remarks}
  //       </div>
  //     );
  //   },
  // },
];