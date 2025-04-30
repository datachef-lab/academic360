

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Award, User, BookOpen, Code2, ArrowUpDown, GraduationCap, BookUser } from "lucide-react";
import { Report } from "./types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


export const ReportColumns: ColumnDef<Report>[] = [
  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <FileText className="h-4 w-4 text-teal-600" />
  //       <span>ID</span>
  //       <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>Roll No</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <User className="h-4 w-4 text-teal-600" />
        <span>Registration No.</span>
        <ArrowUpDown className="h-4 w-4 " />
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
  //       <Calendar className="h-4 w-4 text-teal-600" />
  //       <span>UID</span>
  //       <ArrowUpDown className="h-4 w-4 " />
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
        className="flex items-center justify-center  gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookUser className="h-4 w-4 text-teal-600  " />
        <span>Name</span>
        <ArrowUpDown className="h-4 w-4  " />
      </div>
    ),
    cell: ({ row }) => {
      const name = row.original.name;
      
      const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 60%)`;
      };
    
      const bgColor = stringToColor(name);
    
      return (
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: bgColor }}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{name}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "stream",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <GraduationCap className="h-4 w-4 text-teal-600" />
        <span>Stream</span>
        <ArrowUpDown className="h-4 w-4 " />
      </div>
    ),
    cell: ({ row }) => {
      const stream = row.getValue("stream") as string;
      const streamStyles = {
        "BSC": "bg-blue-100 text-blue-800",
        "BCOM": "bg-purple-100 text-purple-800",
        "BA": "bg-green-100 text-green-800",
        "MA": "bg-amber-100 text-amber-800",
      };
      
      return (
        <Badge variant={"outline"}
          className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800"} font-medium border-transparent`}
        >
          {stream}
        </Badge>
      );
    },
  },
  {
    accessorKey: "framework",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Code2 className="h-4 w-4 text-teal-600" />
        <span>Framework</span>
        <ArrowUpDown className="h-4 w-4 " />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.getValue("framework")}
      </div>
    ),
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Code2 className="h-4 w-4 text-teal-600" />
        <span>Year</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>Semester</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>SGPA</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>CGPA</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>Total Full Marks</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>Total Marks Obtained</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span>Credit</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        <Award className="h-4 w-4 text-teal-600" />
        <span>Grade</span>
        <ArrowUpDown className="h-4 w-4 " />
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
        "F(PR)": "bg-red-200 text-red-900",
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
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer hover:text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <CheckCircle2 className="h-4 w-4 text-teal-600" />
        <span>Status</span>
        <ArrowUpDown className="h-4 w-4 " />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isPass = status.includes("PASS");
      
      return (
        <Badge variant={"outline"} className={`${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} border-transparent`}>
          {/* {isPass ? (
            <CheckCircle2 className="h-4 w-4 text-teal-600 mr-1" />
          ) : (
            <XCircle className="h-4 w-4 text-teal-600 mr-1" />
          )} */}
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
        <Award className="h-4 w-4 text-teal-600" />
        <span>Percentage</span>
        <ArrowUpDown className="h-4 w-4 " />
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
          {/* <Award className="h-4 w-4 text-teal-600 mr-1" /> */}
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
  //       <FileText className="h-4 w-4 text-teal-600" />
  //       <span>Remarks</span>
  //       <ArrowUpDown className="h-4 w-4 " />
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