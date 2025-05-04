import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Award, User, BookOpen, Code2, ArrowUpDown, GraduationCap, BookUser } from "lucide-react";
import { Report } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";

const profileImageUrl = import.meta.env.VITE_STUDENT_PROFILE_URL;
export const ReportColumns: ColumnDef<Report>[] = [

  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <FileText className="h-5 w-5 text-purple-500" />
  //       <span>ID</span>
  //     
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
        className="flex items-center gap-2 text-slate-800 font-semibold  cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <User className="h-5 w-5 text-purple-500" />
        <span>Registration No.</span>
       <ArrowUpDown className="h-4 w-4 " />
      </div>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono  bg-indigo-50 text-indigo-700 hover:bg-indigo-50 py-1 px-2 drop-shadow-md">
      {row.getValue("registrationNumber")}
    </Badge>
    ),
  },
  // {
  //   accessorKey: "uid",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <Calendar className="h-5 w-5 text-purple-500" />
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
        className="flex items-center justify-center  gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookUser className="h-5 w-5 text-purple-500  " />
        <span>Name</span>
        <ArrowUpDown className="h-4 w-4  " />
      </div>
    ),
    cell: ({ row }) => {
      const { name, uid } = row.original;
      
      const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 60%)`;
      };
    
      const bgColor = stringToColor(name);
      const avatar = `${profileImageUrl}/Student_Image_${uid}.jpg`;
    
      return (
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            {avatar ? (<AvatarImage
              src={avatar}
              alt={name}
              className="object-cover"
            /> ): 
            (
              <AvatarFallback style={{ backgroundColor: bgColor }}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>

            )
            }
            <AvatarFallback style={{ backgroundColor: bgColor }}>
              <Skeleton className="h-8 w-8 rounded-full "></Skeleton>
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
        className="flex items-center gap-3 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <GraduationCap className="h-5 w-5 text-purple-500" />
        <span>Stream</span>
      
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
          className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800 "} font-medium drop-shadow-md border-none py-1 px-2`}
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Code2 className="h-5 w-5 text-purple-500" />
        <span>Framework</span>
      
      </div>
    ),
    cell: ({ row }) => {
      const framework = row.getValue("framework") as string;
      const frameworkStyles = {
        "CCF": "bg-amber-100 text-amber-700",
        "CBCs": "bg-amber-100 text-amber-700"
      };
      
      return (
        <Badge variant="outline" className={`${frameworkStyles[framework as keyof typeof frameworkStyles]} drop-shadow-md border-none text-xs py-1 px-2`}>
          {framework}
        </Badge>
      );
    },
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <div 
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Code2 className="h-5 w-5 text-purple-500" />
        <span>Year</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>Semester</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>SGPA</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>CGPA</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>Total Full Marks</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>Total Marks Obtained</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookOpen className="h-5 w-5 text-purple-500" />
        <span>Credit</span>
      
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Award className="h-5 w-5 text-purple-500" />
        <span>Grade</span>
      
      </div>
    ),
    cell: ({ row }) => {
      const grade = row.getValue("letterGrade") as string;
      const gradeStyles = {
        "A++": "bg-purple-100 text-purple-800",
        "A+": "bg-blue-100 text-blue-800",
        "A": "bg-green-100 text-green-800",
        "B+": "bg-purple-100 text-purple-800",
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
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <CheckCircle2 className="h-5 w-5 text-purple-500" />
        <span>Status</span>
      
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isPass = status.includes("PASS");
      
      return (
        <Badge variant={"outline"} className={`${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} border-transparent`}>
          {/* {isPass ? (
            <CheckCircle2 className="h-5 w-5 text-purple-500 mr-1" />
          ) : (
            <XCircle className="h-5 w-5 text-purple-500 mr-1" />
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
        className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Award className="h-5 w-5 text-purple-500" />
        <span>Percentage</span>
      
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
          {/* <Award className="h-5 w-5 text-purple-500 mr-1" /> */}
          {score}
        </Badge>
      );
    },
  },
  // {
  //   accessorKey: "remarks",
  //   header: ({ column }) => (
  //     <div 
  //       className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       <FileText className="h-5 w-5 text-purple-500" />
  //       <span>Remarks</span>
  //     
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

// import { ColumnDef } from "@tanstack/react-table";
// import { Badge } from "@/components/ui/badge";
// import { 
//   CheckCircle2, 
  
//   ArrowUpDown, 
//   GraduationCap, 
//   BookUser,
//   Hash,
//   Percent,
//   Bookmark,
//   School,
//   Calendar,
//   Gauge,
//   Trophy,
//   Star
// } from "lucide-react";
// import { Report } from "./types";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// export const ReportColumns: ColumnDef<Report>[] = [
//   {
//     accessorKey: "rollNumber",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Hash className="h-5 w-5 text-indigo-600" />
//         <span>Roll No</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium pl-2">
//         {row.getValue("rollNumber")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "registrationNumber",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Bookmark className="h-5 w-5 text-indigo-600" />
//         <span>Reg No.</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium">
//         <Badge variant="secondary" className="font-mono bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
//           {row.getValue("registrationNumber")}
//         </Badge>
//       </div>
//     ),
//   },
//   {
//     accessorKey: "name",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <BookUser className="h-5 w-5 text-indigo-600" />
//         <span>Name</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const name = row.original.name;
      
//       const stringToColor = (str: string) => {
//         let hash = 0;
//         for (let i = 0; i < str.length; i++) {
//           hash = str.charCodeAt(i) + ((hash << 5) - hash);
//         }
//         return `hsl(${hash % 360}, 70%, 60%)`;
//       };
    
//       const bgColor = stringToColor(name);
    
//       return (
//         <div className="flex items-center">
//           <Avatar className="h-9 w-9">
//             <AvatarFallback 
//               className="text-white font-medium"
//               style={{ backgroundColor: bgColor }}
//             >
//               {name.charAt(0).toUpperCase()}
//             </AvatarFallback>
//           </Avatar>
//           <div className="ml-3">
//             <div className="font-medium text-gray-900">{name}</div>
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "stream",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <GraduationCap className="h-5 w-5 text-indigo-600" />
//         <span>Stream</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const stream = row.getValue("stream") as string;
//       const streamStyles = {
//         "BSC": "bg-blue-100 text-blue-800 border-blue-200",
//         "BCOM": "bg-purple-100 text-purple-800 border-purple-200",
//         "BA": "bg-green-100 text-green-800 border-green-200",
//         "MA": "bg-amber-100 text-amber-800 border-amber-200",
//       };
      
//       return (
//         <Badge 
//           className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800"} 
//           font-medium px-2.5 py-1 rounded-md`}
//         >
//           {stream}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "year",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Calendar className="h-5 w-5 text-indigo-600" />
//         <span>Year</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium">
//         Year {row.getValue("year")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "semester",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <School className="h-5 w-5 text-indigo-600" />
//         <span>Semester</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => (
//       <div className="text-slate-700 font-medium">
//         Sem {row.getValue("semester")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "cgpa",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Gauge className="h-5 w-5 text-indigo-600" />
//         <span>CGPA</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const cgpa = parseFloat(row.getValue("cgpa"));
//       const cgpaColor = cgpa >= 9 ? "bg-purple-100 text-purple-800" :
//                        cgpa >= 8 ? "bg-blue-100 text-blue-800" :
//                        cgpa >= 7 ? "bg-green-100 text-green-800" :
//                        cgpa >= 6 ? "bg-amber-100 text-amber-800" :
//                        "bg-red-100 text-red-800";
      
//       return (
//         <Badge className={`${cgpaColor} font-mono font-bold px-2.5 py-1 rounded-md`}>
//           {row.getValue("cgpa")}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "letterGrade",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Trophy className="h-5 w-5 text-indigo-600" />
//         <span>Grade</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const grade = row.getValue("letterGrade") as string;
//       const gradeStyles = {
//         "A++": "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200",
//         "A+": "bg-blue-50 text-blue-800 border-blue-200",
//         "A": "bg-green-50 text-green-800 border-green-200",
//         "B+": "bg-purple-50 text-purple-800 border-purple-200",
//         "B": "bg-cyan-50 text-cyan-800 border-cyan-200",
//         "C+": "bg-amber-50 text-amber-800 border-amber-200",
//         "C": "bg-orange-50 text-orange-800 border-orange-200",
//         "D+": "bg-yellow-50 text-yellow-800 border-yellow-200",
//         "D": "bg-lime-50 text-lime-800 border-lime-200",
//         "E": "bg-pink-50 text-pink-800 border-pink-200",
//         "F": "bg-red-50 text-red-800 border-red-200",
//         "F(TH)": "bg-red-100 text-red-900 border-red-200",
//         "F(PR)": "bg-red-100 text-red-900 border-red-200",
//       };
      
//       return (
//         <Badge className={`${gradeStyles[grade as keyof typeof gradeStyles] || "bg-gray-100 text-gray-800"} 
//           font-bold px-2.5 py-1 rounded-md`}
//         >
//           {grade}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "status",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <CheckCircle2 className="h-5 w-5 text-indigo-600" />
//         <span>Status</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const status = row.getValue("status") as string;
//       const isPass = status.includes("PASS");
      
//       return (
//         <Badge className={`${isPass ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"} 
//           font-medium px-2.5 py-1 rounded-md flex items-center gap-1`}
//         >
//           {isPass ? (
//             <CheckCircle2 className="h-5 w-5 text-emerald-600" />
//           ) : null}
//           {status}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "percentage",
//     header: ({ column }) => (
//       <div 
//         className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer "
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <Percent className="h-5 w-5 text-indigo-600" />
//         <span>Percentage</span>
//         <ArrowUpDown className="h-5 w-5 opacity-70" />
//       </div>
//     ),
//     cell: ({ row }) => {
//       const score = row.getValue("percentage") as string;
//       const scoreValue = parseFloat(score.replace('%', ''));
//       const scoreColor = scoreValue >= 90 ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800" :
//                        scoreValue >= 75 ? "bg-blue-50 text-blue-800" :
//                        scoreValue >= 50 ? "bg-green-50 text-green-800" :
//                        scoreValue >= 30 ? "bg-amber-50 text-amber-800" :
//                        "bg-red-50 text-red-800";
      
//       return (
//         <Badge className={`${scoreColor} font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1`}>
//           <Star className="h-3 w-3 opacity-70" />
//           {score}
//         </Badge>
//       );
//     },
//   },
// ];