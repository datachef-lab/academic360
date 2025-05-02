import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Stream } from "@/types/academics/stream";
import { Gender, StudentStatus } from "@/types/enums";
import { Category } from "@/types/resources/category";
import { Nationality } from "@/types/resources/nationality";
import { Religion } from "@/types/resources/religion";
import { Specialization } from "@/types/resources/specialization";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Hash, BookUser, Church, Layers, Eye, Image } from 'lucide-react';
import { 
  FaVenus, 
  FaMars, 
  FaTransgender, 
  FaGenderless,
  FaQuestion
} from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export interface StudentSearchType {
  readonly id?: number;
  registrationNumber: string | null;
  rollNumber: string | null;
  uid: string | null;
  name: string;
  nationality: Nationality | null;
  gender: Gender | null;
  religion: Religion | null;
  category: Category | null;
  handicapped: boolean;
  stream: Stream | null;
  specialization: Specialization | null;
  active: boolean;
  alumni: boolean;
  leavingDate: Date | null;
  avatar?: string;
}

export const studentSearchColumns: ColumnDef<StudentSearchType>[] = [
  {
    accessorKey: "avatar",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Image className="h-4 w-4 text-teal-600"/>
        <span>Avatar</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      const name = student.name;
      const avatar = student.avatar;
      
      const [imgError, setImgError] = useState(false);
      
      // Log avatar URL to debug
      useEffect(() => {
        if (avatar) {
          console.log(`Avatar URL for ${name}:`, avatar);
        }
      }, [avatar, name]);
      
      const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 70%, 60%)`;
        return color;
      };
    
      const bgColor = stringToColor(name);
    
      return (
        <div className="flex items-center justify-center">
          <Avatar className="h-10 w-10">
            {avatar && !imgError ? (
              <AvatarImage 
                className="object-cover"
                src={avatar} 
                alt={name} 
                onError={() => {
                  console.error(`Avatar failed to load for ${name}:`, avatar);
                  setImgError(true);
                }}
              />
            ) : null}
            <AvatarFallback style={{ backgroundColor: bgColor }}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "rollNumber",
    header: () => (
      <div className="flex items-center justify-center   gap-1 whitespace-nowrap text-slate-800 font-semibold">
        <Hash className="h-4 w-4 text-teal-600" />
        <span>Roll No.</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return student.rollNumber ? <p className="whitespace-nowrap">{student.rollNumber}</p> : <p>-</p>;
    },
  },
  {
    accessorKey: "registrationNumber",
    header: () => (
      <div className="flex items-center justify-center  gap-1 whitespace-nowrap text-slate-800 font-semibold">
        <Hash className="h-4 w-4 text-teal-600" />
        <span>Registration No.</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return student.registrationNumber ? <p>{student.registrationNumber}</p> : <p>-</p>;
    },
  },
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <BookUser className="h-4 w-4 text-teal-600" />
        <span>Name</span>
      </div>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;      
      return (
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900">{name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "gender",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-700 font-medium">
        <FaTransgender className="h-4 w-4 text-teal-600 " />
        <span className="text-sm">Gender</span>
      </div>
    ),
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string;
      
      const genderBadges = {
        FEMALE: {
          icon: <FaVenus className="h-3.5 w-3.5" />,
          className: "bg-pink-100/50 text-pink-800 hover:bg-pink-100",
          label: "Female",
        },
        MALE: {
          icon: <FaMars className="h-3.5 w-3.5" />,
          className: "bg-blue-100/50 text-blue-800 hover:bg-blue-100",
          label: "Male",
        },
        'Non-binary': {
          icon: <FaTransgender className="h-3.5 w-3.5" />,
          className: "bg-purple-100/50 text-purple-800 hover:bg-purple-100",
          label: "Non-binary",
        },
        Other: {
          icon: <FaGenderless className="h-3.5 w-3.5" />,
          className: "bg-gray-100/50 text-gray-800 hover:bg-gray-100",
          label: "Other",
        }
      };
  
      const config = genderBadges[gender as keyof typeof genderBadges] || {
        icon: <FaQuestion className="h-3.5 w-3.5" />,
        className: "bg-gray-100/50 text-gray-800 hover:bg-gray-100",
        label: 'Not specified'
      };
  
      return (
        <Badge className={`gap-1.5 px-2.5 py-1 text-xs font-medium ${config.className}`}>
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
        <Church className="h-4 w-4 text-teal-600" />
        <span>Religion</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return student.religion ? (
        <Badge variant="outline" className="text-xs py-1 px-2 bg-amber-50 text-amber-700 border-amber-200">
          {student.religion.name}
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
        <Layers className="h-4 w-4 text-teal-600" />
        <span>Category</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      const category = student.category?.name?.toUpperCase();

      const getBadgeStyle = (category: string) => {
        switch (category) {
          case "GENERAL":
            return "bg-blue-100 text-blue-800 border-blue-200";
          case "SC":
            return "bg-green-100 text-green-800 border-green-200";
          case "ST":
            return "bg-purple-100 text-purple-800 border-purple-200";
          case "OBC-A":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
          case "OBC-B":
            return "bg-amber-100 text-amber-800 border-amber-200";
          default:
            return "bg-gray-100 text-gray-800 border-gray-200";
        }
      };

      return category ? (
        <Badge variant="outline" className={`text-xs py-1 px-2 ${getBadgeStyle(category)}`}>
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
        <Layers className="h-4 w-4 text-teal-600" />
        <span>Stream</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return student.stream ? <p>{student.stream.name}</p> : <p>-</p>;
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
        <Layers className="h-4 w-4 text-teal-600" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      let status: StudentStatus | null = null;

      if (student.leavingDate || (!student.active && student.alumni)) {
        status = "GRADUATED";
      } else if (student.active == null || student.alumni == null) {
        status = null;
      } else if (!student.active && !student.alumni) {
        status = "DROPPED_OUT";
      } else if (student.active && !student.alumni) {
        status = "ACTIVE";
      } else if (student.active && student.alumni) {
        status = "PENDING_CLEARANCE";
      }

      return <p>{status ? status : "-"}</p>;
    },
  },
  {
    accessorKey: "actions",
    header: () => (
      <div className="flex items-center justify-start gap-1 text-slate-800 font-semibold">
        <Eye className="h-4 w-4 text-teal-600" />
        <span>Actions</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return (
        <Link to={`${student.id}`} className="p-0 m-0 flex">
          <Button variant="secondary"  className="drop-shadow-md bg-gray-200 border" size="sm">
            View
          </Button>
        </Link>
      );
    },
  },
];