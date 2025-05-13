import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import {  BookUser, Church, Layers, Flag, Calendar, ClipboardList, FileText } from 'lucide-react';
import {
  FaVenus,
  FaMars,
  FaTransgender,
  FaGenderless,
  FaQuestion
} from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Student } from "@/types/user/student";

const profileImageUrl = import.meta.env.VITE_STUDENT_PROFILE_URL;

export const studentDownloadColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start pl-3 gap-2 text-slate-800 font-semibold cursor-pointer">
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
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            {avatar ? (
              <AvatarImage
                src={avatar}
                alt={name}
                className="object-cover  "
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
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className="font-mono bg-amber-100 text-amber-700 py-1 px-3 drop-shadow-md border-none"
          >
            {student?.rollNumber}
          </Badge>
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
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className="font-mono bg-blue-50 text-blue-700 py-1 px-3 drop-shadow-md border-none"
          >
            {student?.registrationNumber}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "dateOfBirth",
    header: () => (
      <div className="flex items-center justify-center gap-1 whitespace-nowrap text-slate-800 font-semibold">
        <Calendar className="h-5 w-5 text-purple-600" /> 
        <span>D.O.B</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row?.original?.personalDetails;
      return (
        <div className="flex item-center justify-center">
          <Badge 
            variant="outline" 
            className="font-mono bg-purple-50 text-purple-700 py-1 px-3 drop-shadow-md border-none"
          >
            {student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gender",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-700 font-medium">
        <FaTransgender className="h-5 w-5 text-purple-600" /> 
        <span className="text-sm">Gender</span>
      </div>
    ),
    cell: ({ row }) => {
      const gender = row.original?.personalDetails?.gender ?? null;

      const genderBadges = {
        FEMALE: {
          icon: <FaVenus className="h-3.5 w-3.5" />,
          className: "bg-pink-50 text-pink-700",
          label: "Female",
        },
        MALE: {
          icon: <FaMars className="h-3.5 w-3.5" />,
          className: "bg-indigo-50 text-indigo-700",
          label: "Male",
        },
        'Non-binary': {
          icon: <FaTransgender className="h-3.5 w-3.5" />,
          className: "bg-purple-50 text-purple-700",
          label: "Non-binary",
        },
        Other: {
          icon: <FaGenderless className="h-3.5 w-3.5" />,
          className: "bg-gray-50 text-gray-700",
          label: "Other",
        }
      };

      const config = genderBadges[gender as keyof typeof genderBadges] || {
        icon: <FaQuestion className="h-3.5 w-3.5" />,
        className: "bg-gray-50 text-gray-700",
        label: 'Not specified'
      };

      return (
        <Badge 
          variant="outline" 
          className={`gap-1.5 px-2.5 py-1 text-xs font-medium drop-shadow-md border-none ${config.className}`}
        >
          {config.icon}
          {gender || config.label}
        </Badge>
      );
    }
  },
  {
    accessorKey: "religion",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Church className="h-5 w-5 text-purple-600" /> 
        <span>Religion</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original.personalDetails;
      return student?.religion ? (
        <Badge 
          variant="outline" 
          className="text-xs py-1 px-2 bg-amber-50 text-amber-700 drop-shadow-md border-none"
        >
          {student?.religion.name}
        </Badge>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
      );
    },
  },
  {
    accessorKey: "category",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Layers className="h-5 w-5 text-purple-600" /> 
        <span>Category</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original.personalDetails?.category;
      const category = student?.name?.toUpperCase();

      const getBadgeStyle = (category: string) => {
        switch (category) {
          case "GENERAL":
            return "bg-blue-50 text-blue-700";
          case "SC":
            return "bg-green-50 text-green-700";
          case "ST":
            return "bg-purple-50 text-purple-700";
          case "OBC-A":
            return "bg-yellow-50 text-yellow-700";
          case "OBC-B":
            return "bg-amber-50 text-amber-700";
          default:
            return "bg-gray-50 text-gray-700";
        }
      };

      return category ? (
        <Badge 
          variant="outline" 
          className={`text-xs py-1 px-2 drop-shadow-md border-none ${getBadgeStyle(category)}`}
        >
          {category}
        </Badge>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
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
          className="bg-indigo-50 text-indigo-700 drop-shadow-md border-none"
        >
          {student.name}
        </Badge>
      ) : (
        <p>-</p>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Layers className="h-5 w-5 text-purple-600" /> 
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original.academicIdentifier?.stream?.degree;
      return (
        <Badge 
          variant="outline" 
          className="gap-1.5 px-2.5 py-1 text-xs font-mono bg-violet-50 text-violet-700 drop-shadow-md border-none"
        >
          {student?.level}
        </Badge>
      );
    },
  },
  {
    accessorKey: "nationality",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Flag className="h-5 w-5 text-purple-600" /> 
        <span>Nationality</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row?.original?.personalDetails?.nationality;
      return (
        <div className="flex item-center justify-center">
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 py-1 px-3 drop-shadow-md border-none"
          >
            {student?.name}
          </Badge>
        </div>
      );
    },
  },
];