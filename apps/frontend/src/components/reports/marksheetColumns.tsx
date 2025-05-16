import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Code2, 
  ArrowUpDown, 
  GraduationCap, 
  BookUser,
  School,
  Calendar,
  Gauge,
  Star,
  FileText,
  ClipboardList,
  BookMarked,
  Calculator,
  Percent,
 
  FilePenLine,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { MarksheetTableType } from "@/types/tableTypes/MarksheetTableType";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";

const profileImageUrl = import.meta.env.VITE_STUDENT_PROFILE_URL;

export const MarksheetColumns: ColumnDef<MarksheetTableType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-start pl-3 gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookUser className="h-5 w-5 text-purple-500" />
        <span>Name</span>
        <ArrowUpDown className="h-4 w-4" />
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
    
      const bgColor = stringToColor(name || '');
      const avatar = `${profileImageUrl}/Student_Image_${uid}.jpg`;
    
      return (
        <div className="flex items-center justify-start">
          <Avatar className="h-8 w-8">
            {avatar ? (
              <AvatarImage
                src={avatar}
                alt={name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback style={{ backgroundColor: bgColor }}>
                {name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
            <AvatarFallback style={{ backgroundColor: bgColor }}>
              <Skeleton className="h-8 w-8 rounded-full"></Skeleton>
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
    accessorKey: "rollNumber",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <FileText className="h-5 w-5 text-purple-500" />
        <span>Roll No</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100 py-1 px-3 drop-shadow-md  border-none">
          {row.getValue("rollNumber")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "registrationNumber",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <ClipboardList className="h-5 w-5 text-purple-500" />
        <span>Reg No.</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100 py-1 px-3 drop-shadow-md  border-none">
          {row.getValue("registrationNumber")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "stream",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
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
        <div className="flex justify-center">
          <Badge variant="outline" className={`${streamStyles[stream as keyof typeof streamStyles] || "bg-gray-100 text-gray-800"} font-medium drop-shadow-md  border-none py-1 px-3`}>
            {stream}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "framework",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
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
        "CBCS": "bg-amber-100 text-amber-700"
      };
      
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={`${frameworkStyles[framework as keyof typeof frameworkStyles]} drop-shadow-md  border-none text-xs py-1 px-3`}>
            {framework}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "year1",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Calendar className="h-5 w-5 text-purple-500" />
        <span>Year1</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-indigo-100 text-indigo-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("year1")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "year2",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Calendar className="h-5 w-5 text-purple-500" />
        <span>Year2</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("year2")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "semester",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <School className="h-5 w-5 text-purple-500" />
        <span>Semester</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-teal-100 text-teal-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("semester")}
        </Badge>
      </div>
    ),
  },
   {
    accessorKey: "marksheetCode",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-start gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <FilePenLine className="h-5 w-5 text-purple-500" />
        <span>Marksheet Code</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 flex items-center justify-start  font-semibold  ">
        {row.getValue("marksheetCode")}
      </div>
    ),
  },
  {
    accessorKey: "subjectName",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-start pl-8 gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookMarked className="h-5 w-5 text-purple-500" />
        <span>Subject</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 flex items-center font-semibold  justify-start">
        {row.getValue("subjectName")}
      </div>
    ),
  },
  {
    accessorKey: "marksheetCode",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-start pl-8 gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <BookMarked className="h-5 w-5 text-purple-500" />
        <span>Marksheet Code</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 flex items-center font-semibold  justify-start">
        {row.getValue("marksheetCode")}
      </div>
    ),
  },
  {
    accessorKey: "fullMarks",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Calculator className="h-5 w-5 text-purple-500" />
        <span>Full Marks</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-orange-100 text-orange-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("fullMarks")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "obtainedMarks",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Percent className="h-5 w-5 text-purple-500" />
        <span>Obtained Marks</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-pink-100 text-pink-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("obtainedMarks")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "credit",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Star className="h-5 w-5 text-purple-500" />
        <span>Credit</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("credit")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "sgpa",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Gauge className="h-5 w-5 text-purple-500" />
        <span>SGPA</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-purple-100 text-purple-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("sgpa")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "cgpa",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Gauge className="h-5 w-5 text-purple-500" />
        <span>CGPA</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-slate-700">
        <Badge variant="outline" className="bg-pink-100 text-pink-700 drop-shadow-md py-1 px-3  border-none">
          {row.getValue("cgpa")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "letterGrade",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
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
        <div className="flex justify-center">
          <Badge variant="outline" className={`${gradeStyles[grade as keyof typeof gradeStyles] || "bg-gray-100 text-gray-800"} border-none drop-shadow-md py-1 px-3  font-medium`}>
            {grade}
          </Badge>
        </div>
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
         <Badge variant={"outline"} className={`${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} drop-shadow-lg border-transparent`}>
           {isPass ? (
             <CheckCircle2 className="h-4 w-4 text-emerald-700 mr-1" />
           ) : (
             <XCircle className="h-4 w-4 text-rose-700 mr-1" />
           )}
           {status}
         </Badge>
       );
     },
   },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <div 
        className="flex items-center justify-center gap-2 text-slate-800 font-semibold cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <ClipboardList className="h-5 w-5 text-purple-500" />
        <span>Remarks</span>
      </div>
    ),
    cell: ({ row }) => {
      const remarks = row.getValue("remarks") as string;
      const isCritical = remarks?.includes("not") || remarks?.includes("re-exam");
      
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={`${isCritical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} drop-shadow-md py-1 px-3  border-none max-w-[200px] truncate`}>
            {remarks}
          </Badge>
        </div>
      );
    },
  },
];