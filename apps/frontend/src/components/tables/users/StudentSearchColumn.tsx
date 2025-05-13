import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import { BookUser, FileText, ClipboardList, Layers, Eye, ArrowUpRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Student } from "@/types/user/student";
import { Button } from "@/components/ui/button";

const profileImageUrl = import.meta.env.VITE_STUDENT_PROFILE_URL;

interface TableMeta {
  onViewStudent?: (studentId: number) => void;
}

export const StudentSearchColumn: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start pl-0 gap-2 text-slate-800 font-semibold cursor-pointer">
        <BookUser className="h-5 w-5 text-purple-500" /> 
        <span>Name</span>
      </div>
    ),
    cell: ({ row }) => {
      const uid = row?.original?.academicIdentifier?.uid ?? null;
      const { name } = row.original;
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
        <div className="flex items-center ">
          <Avatar className="h-8 w-8">
            {avatar ? (
              <AvatarImage
                src={avatar}
                alt={name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback style={{ backgroundColor: bgColor }}>
                {name.charAt(0).toUpperCase()}
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
    header: () => (
      <div className="flex items-center justify-center gap-1 whitespace-nowrap text-slate-800 text-base font-semibold">
        <FileText className="h-5 w-5 text-purple-600" /> 
        <span>Roll No.</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original?.academicIdentifier;
      return (
        <div className="div">
{student?.rollNumber ?( <div className="flex justify-start text-sm font-medium text-gray-900">
  <Badge variant="outline" className="text-xs py-1 px-2 bg-purple-100/90 text-purple-800 font-mono drop-shadow-xl border-none ">
          {student?.rollNumber }
          </Badge>
        </div>):(
        <p>-</p>
        )}
        </div>
      );
    },
  },
  {
    accessorKey: "registrationNumber",
    header: () => (
      <div className="flex items-center justify-center gap-1 whitespace-nowrap text-slate-800 font-semibold">
        <ClipboardList className="h-5 w-5 text-purple-600" /> 
        <span>Registration No.</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row?.original?.academicIdentifier ?? null;
      return (
        <div className="div">
        {student?.registrationNumber ?( <div className="flex justify-start text-sm font-medium text-gray-900">
          <Badge variant="outline" className="text-xs py-1 px-2 bg-purple-100/90 text-purple-800 font-mono drop-shadow-xl border-none ">
                  {student?.registrationNumber }
                  </Badge>
                </div>):(
                <p>-</p>
                )}
                </div>
      );
    },
  },
  {
    accessorKey: "stream",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Layers className="h-5 w-5 text-purple-600" /> 
        <span>Stream</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original.academicIdentifier?.stream?.degree;
      return student ? (
        <Badge 
          variant="outline" 
           className="text-xs py-1 px-2 bg-purple-100/90 text-purple-800 font-mono drop-shadow-xl border-none "
        >
          {student.name}
        </Badge>
      ) : (
        <p>-</p>
      );
    },
  },
   {
    accessorKey: "actions",
    header: () => (
      <div className="flex items-center gap-1 text-slate-800 font-semibold">
        <Eye className="h-5 w-5 text-purple-600" />
        <span>Actions</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const student = row.original?.academicIdentifier;
      const onViewStudent = (table.options.meta as TableMeta)?.onViewStudent;
      
      if (!student?.studentId) return null;
      
      return (
        <Button 
          variant="secondary" 
          className="flex items-center gap-2 drop-shadow-lg bg-purple-800/90 px-4 py-3 text-white border-none hover:bg-purple-800 transition-all duration-100 hover:scale-105 hover:shadow-xl" 
          size="sm"
          onClick={() => onViewStudent?.(student.studentId)}
        >
          <ArrowUpRight  className="h-5 w-5" />
          <span>View</span>
        </Button>
      );
    },
  },
];