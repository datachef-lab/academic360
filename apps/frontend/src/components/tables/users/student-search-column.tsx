// // import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
// // import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// // import { Button } from "@/components/ui/button";
// // // import { Checkbox } from "@/components/ui/checkbox";
// // import { Stream } from "@/types/academics/stream";
// // import { Gender, StudentStatus } from "@/types/enums";
// // import { Category } from "@/types/resources/category";
// // import { Nationality } from "@/types/resources/nationality";
// // import { Religion } from "@/types/resources/religion";
// // import { Specialization } from "@/types/resources/specialization";

// // import { ColumnDef } from "@tanstack/react-table";
// // import { Link } from "react-router-dom";

// // export interface StudentSearchType {
// //   readonly id?: number;
// //   registrationNumber: string | null;
// //   rollNumber: string | null;
// //   uid: string | null;
// //   name: string;
// //   nationality: Nationality | null;
// //   gender: Gender | null;
// //   religion: Religion | null;
// //   category: Category | null;
// //   handicapped: boolean;
// //   stream: Stream | null;
// //   specialization: Specialization | null;
// //   active: boolean;
// //   alumni: boolean;
// //   leavingDate: Date | null;
// // }

// // export const studentSearchColumns: ColumnDef<StudentSearchType>[] = [
// //   // {
// //   //   id: "select",
// //   //   header: ({ table }) => (
// //   //     <Checkbox
// //   //       checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
// //   //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
// //   //       aria-label="Select all"
// //   //     />
// //   //   ),
// //   //   cell: ({ row }) => (
// //   //     <Checkbox
// //   //       checked={row.getIsSelected()}
// //   //       onCheckedChange={(value) => row.toggleSelected(!!value)}
// //   //       aria-label="Select row"
// //   //     />
// //   //   ),
// //   //   enableSorting: false,
// //   //   enableHiding: false,
// //   // },

// //   {
// //     accessorKey: "rollNumber",
// //     header: "Roll No.",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       if (student.rollNumber) {
// //         return <p>{student.rollNumber}</p>;
// //       }

// //       return <p>-</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "registrationNumber",
// //     header: "Registration No.",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       if (student.registrationNumber) {
// //         return <p>{student.registrationNumber}</p>;
// //       }

// //       return <p>-</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "name",
// //     header: ({ column }) => {
// //       return <DataTableColumnHeader column={column} title="Name" />;
// //     },
// //     cell: ({ row }) => {
// //       const name = row.original.name;
      
// //       // Function to generate a unique color from name
// //       const stringToColor = (str: string) => {
// //         let hash = 0;
// //         for (let i = 0; i < str.length; i++) {
// //           hash = str.charCodeAt(i) + ((hash << 5) - hash);
// //         }
// //         const color = `hsl(${hash % 360}, 70%, 60%)`;
// //         return color;
// //       };
    
// //       const bgColor = stringToColor(name);
    
// //       return (
// //         <div className="flex items-center">
// //           <Avatar className="h-8 w-8">
// //             <AvatarFallback style={{ backgroundColor: bgColor }}>
// //               {name.charAt(0).toUpperCase()}
// //             </AvatarFallback>
// //           </Avatar>
// //           <div className="ml-4">
// //             <div className="text-sm font-medium text-gray-900">{name}</div>
// //           </div>
// //         </div>
// //       );
// //     },
    
// //   },
// //   {
// //     accessorKey: "gender",
// //     header: "Gender",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       if (student.gender) {
// //         return <p>{student.gender}</p>;
// //       }

// //       return <p>-</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "religion",
// //     header: "Religion",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       if (student.religion) {
// //         return <p>{student.religion.name}</p>;
// //       }

// //       return <p>-</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "category",
// //     header: "Category",
// //     cell: ({ row }) => {
// //       const student = row.original;
// //       const category = student.category?.name?.toUpperCase();
  
// //       const getBadgeStyle = (category: string) => {
// //         switch (category) {
// //           case "GENERAL":
// //             return "bg-blue-200 text-blue-600";
// //           case "SC":
// //             return "bg-green-100 text-green-800";
// //           case "ST":
// //             return "bg-purple-200 text-purple-800";
// //           case "OBC-A":
// //             return "bg-yellow-100 text-yellow-800";
// //           default:
// //             return "bg-pink-100 text-pink-800";
// //         }
// //       };
  
// //       return category ? (
// //         <span
// //           className={`px-3 py-2 rounded-full border text-xs font-semibold ${getBadgeStyle(
// //             category
// //           )}`}
// //         >
// //           {category}
// //         </span>
// //       ) : (
// //         <span className="text-gray-500">-</span>
// //       );
// //     },
// //   },
  
 

// //   {
// //     accessorKey: "stream",
// //     header: "Stream",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       if (student.stream) {
// //         return <p>{student.stream.name}</p>;
// //       }

// //       return <p>-</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "status",
// //     header: "Status",
// //     cell: ({ row }) => {
// //       const student = row.original;
// //       let status: StudentStatus | null = null;

// //       if (student.leavingDate || (!student.active && student.alumni)) {
// //         status = "GRADUATED";
// //       } else if (student.active == null || student.alumni == null) {
// //         status = null;
// //       } else if (!student.active && !student.alumni) {
// //         status = "DROPPED_OUT";
// //       } else if (student.active && !student.alumni) {
// //         status = "ACTIVE";
// //       } else if (student.active && student.alumni) {
// //         status = "PENDING_CLEARANCE";
// //       }

// //       return <p>{status ? status : "-"}</p>;
// //     },
// //   },
// //   {
// //     accessorKey: "nationality",
// //     header: ({ column }) => {
// //       return <DataTableColumnHeader column={column} title="Nationality" />;
// //     },
// //   },
// //   {
// //     accessorKey: "leavingDate",
// //     header: "Leaving Date",
// //   },
// //   {
// //     header: "Actions",
// //     cell: ({ row }) => {
// //       const student = row.original;

// //       return (
// //         <Link to={`${student.id}`} className="p-0 m-0 flex">
// //           <Button variant="secondary" size="sm">
// //             View
// //           </Button>
// //         </Link>
// //       );
// //     },
// //   },
// // ];


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

import { Hash, BookUser, Church, Layers, Eye } from 'lucide-react';
import { 
  FaVenus, 
  FaMars, 
  FaTransgender, 
  FaGenderless,
  FaQuestion
} from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
avatar?:string;
}

export const studentSearchColumns: ColumnDef<StudentSearchType>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center justify-start pl-6  gap-1 text-slate-800 font-semibold">
        <BookUser className="h-5 w-5 text-purple-600" />
        <span>Name</span>
      </div>
    ),
    cell: ({ row }) => {
      const { name,avatar } = row.original;
      // const avatarUrl = `${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${academicIdentifier?.uid}.jpg`;
    
      const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 60%)`;
      };
    
      const bgColor = stringToColor(name);
    
      return (
        <div className="flex items-center justify-start whitespace-nowrap">
          <Avatar className="h-9 w-9">
            {avatar ? (
              <AvatarImage
                className="object-cover drop-shadow-lg"
                src={avatar}
                alt={name}
                
              />
            ) : (
              <AvatarFallback 
                className="text-white font-medium"
                style={{ backgroundColor: bgColor }}
              >
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
            <AvatarFallback style={{ backgroundColor: bgColor }} >
              <Skeleton className="h-9 w-9  drop-shadow-md rounded-full" />
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{name}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "rollNumber",
    header: () => (
      <div className="flex items-center justify-center   gap-1 whitespace-nowrap text-slate-800 text-base font-semibold">
        <Hash className="h-5 w-5 text-purple-600" />
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
        <Hash className="h-5 w-5 text-purple-600" />
        <span>Registration No.</span>
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original;
      return student.registrationNumber ? <p>{student.registrationNumber}</p> : <p>-</p>;
    },
  },
 
  {
    accessorKey: "gender",
    header: () => (
      <div className="flex items-center justify-center gap-1 text-slate-700 font-medium">
        <FaTransgender className="h-5 w-5 text-purple-600 " />
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
        <Church className="h-5 w-5 text-purple-600" />
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
        <Layers className="h-5 w-5 text-purple-600" />
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
        <Layers className="h-5 w-5 text-purple-600" />
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
        <Layers className="h-5 w-5 text-purple-600" />
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
  // {
  //   accessorKey: "nationality",
  //   header: () => (
  //     <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
  //       <Flag className="h-5 w-5 text-purple-600" />
  //       <span>Nationality</span>
  //     </div>
  //   ),
  // },
  // {
  //   accessorKey: "leavingDate",
  //   header: () => (
  //     <div className="flex items-center justify-center gap-1 text-slate-800 font-semibold">
  //       <CalendarDays className="h-5 w-5 text-purple-600" />
  //       <span>Leaving Date</span>
  //     </div>
  //   ),
  // },
  {
      accessorKey: "actions",
      header: () => (
        <div className="flex items-center justify-start gap-1 text-slate-800 font-semibold">
          <Eye className="h-5 w-5 text-purple-600" />
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

// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Stream } from "@/types/academics/stream";
// import { Gender, StudentStatus } from "@/types/enums";
// import { Category } from "@/types/resources/category";
// import { Nationality } from "@/types/resources/nationality";
// import { Religion } from "@/types/resources/religion";
// import { Specialization } from "@/types/resources/specialization";
// import { ColumnDef } from "@tanstack/react-table";
// import { Link } from "react-router-dom";

// import { Hash, BookUser, Church, Layers, Eye, GraduationCap, UserX } from 'lucide-react';
// import { 
//   FaVenus, 
//   FaMars, 
//   FaTransgender, 
//   FaGenderless,
//   FaQuestion,
//   FaHandPaper
// } from "react-icons/fa";
// import { Badge } from "@/components/ui/badge";

// export interface StudentSearchType {
//   readonly id?: number;
//   registrationNumber: string | null;
//   rollNumber: string | null;
//   uid: string | null;
//   name: string;
//   nationality: Nationality | null;
//   gender: Gender | null;
//   religion: Religion | null;
//   category: Category | null;
//   handicapped: boolean;
//   stream: Stream | null;
//   specialization: Specialization | null;
//   active: boolean;
//   alumni: boolean;
//   leavingDate: Date | null;
// }

// export const studentSearchColumns: ColumnDef<StudentSearchType>[] = [
//   {
//     accessorKey: "rollNumber",
//     header: () => (
//       <div className="flex items-center justify-center gap-1 whitespace-nowrap text-slate-700 font-medium">
//         <Hash className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Roll No.</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       return student.rollNumber ? (
//         <Badge variant="outline" className="font-mono text-xs py-1 px-2 whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
//           {student.rollNumber}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "registrationNumber",
//     header: () => (
//       <div className="flex items-center justify-center gap-1 whitespace-nowrap text-slate-700 font-medium">
//         <Hash className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Reg. No.</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       return student.registrationNumber ? (
//         <Badge variant="outline" className="font-mono text-xs py-1 px-2 bg-purple-50 text-purple-700 border-purple-200">
//           {student.registrationNumber}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "name",
//     header: () => (
//       <div className="flex items-center justify-center gap-1 text-slate-700 font-medium">
//         <BookUser className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Student Name</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const name = row.original.name;
//       const handicapped = row.original.handicapped;
      
//       const stringToColor = (str: string) => {
//         let hash = 0;
//         for (let i = 0; i < str.length; i++) {
//           hash = str.charCodeAt(i) + ((hash << 5) - hash);
//         }
//         return `hsl(${hash % 360}, 70%, 60%)`;
//       };
    
//       const bgColor = stringToColor(name);
    
//       return (
//         <div className="flex items-center justify-start gap-3">
//           <Avatar className="h-9 w-9 relative">
//             <AvatarFallback 
//               className="text-white font-medium"
//               style={{ backgroundColor: bgColor }}
//             >
//               {name.charAt(0).toUpperCase()}
//             </AvatarFallback>
//             {handicapped && (
//               <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full">
//                 <FaHandPaper className="h-3 w-3" />
//               </span>
//             )}
//           </Avatar>
//           <div>
//             <div className="text-sm font-medium text-gray-900">{name}</div>
//             {row.original.uid && (
//               <div className="text-xs text-gray-500 font-mono">{row.original.uid}</div>
//             )}
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "gender",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <FaTransgender className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Gender</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const gender = row.getValue("gender") as string;
      
//       const genderBadges = {
//         FEMALE: {
//           icon: <FaVenus className="h-3 w-3" />,
//           className: "bg-pink-100 text-pink-800 hover:bg-pink-100/80 border-pink-200",
//           label: "Female",
//         },
//         MALE: {
//           icon: <FaMars className="h-3 w-3" />,
//           className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
//           label: "Male",
//         },
//         'Non-binary': {
//           icon: <FaTransgender className="h-3 w-3" />,
//           className: "bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200",
//           label: "Non-binary",
//         },
//         Other: {
//           icon: <FaGenderless className="h-3 w-3" />,
//           className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200",
//           label: "Other",
//         }
//       };
  
//       const config = genderBadges[gender as keyof typeof genderBadges] || {
//         icon: <FaQuestion className="h-3 w-3" />,
//         className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200",
//         label: 'Not specified'
//       };
  
//       return (
//         <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 text-xs ${config.className}`}>
//           {config.icon}
//           {config.label}
//         </Badge>
//       );
//     }
//   },
//   {
//     accessorKey: "religion",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <Church className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Religion</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       return student.religion ? (
//         <Badge variant="outline" className="text-xs py-1 px-2 bg-amber-50 text-amber-700 border-amber-200">
//           {student.religion.name}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "category",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <Layers className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Category</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       const category = student.category?.name?.toUpperCase();
  
//       const getBadgeStyle = (category: string) => {
//         switch (category) {
//           case "GENERAL":
//             return "bg-blue-100 text-blue-800 border-blue-200";
//           case "SC":
//             return "bg-green-100 text-green-800 border-green-200";
//           case "ST":
//             return "bg-purple-100 text-purple-800 border-purple-200";
//           case "OBC-A":
//             return "bg-yellow-100 text-yellow-800 border-yellow-200";
//           case "OBC-B":
//             return "bg-amber-100 text-amber-800 border-amber-200";
//           default:
//             return "bg-gray-100 text-gray-800 border-gray-200";
//         }
//       };
  
//       return category ? (
//         <Badge variant="outline" className={`text-xs py-1 px-2 ${getBadgeStyle(category)}`}>
//           {category}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "stream",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <Layers className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Stream</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       return student.stream ? (
//         <Badge variant="outline" className="text-xs py-1 px-2 bg-indigo-50 text-indigo-700 border-indigo-200">
//           {student.stream.name}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "status",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <Layers className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Status</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       let status: StudentStatus | null = null;

//       if (student.leavingDate || (!student.active && student.alumni)) {
//         status = "GRADUATED";
//       } else if (student.active == null || student.alumni == null) {
//         status = null;
//       } else if (!student.active && !student.alumni) {
//         status = "DROPPED_OUT";
//       } else if (student.active && !student.alumni) {
//         status = "ACTIVE";
//       } else if (student.active && student.alumni) {
//         status = "PENDING_CLEARANCE";
//       }

//       const statusConfig = {
//         GRADUATED: {
//           icon: <GraduationCap className="h-3 w-3" />,
//           className: "bg-emerald-100 text-emerald-800 border-emerald-200",
//           label: "Graduated"
//         },
//         ACTIVE: {
//           icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />,
//           className: "bg-green-100 text-green-800 border-green-200",
//           label: "Active"
//         },
//         DROPPED_OUT: {
//           icon: <UserX className="h-3 w-3" />,
//           className: "bg-rose-100 text-rose-800 border-rose-200",
//           label: "Dropped Out"
//         },
//         PENDING_CLEARANCE: {
//           icon: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />,
//           className: "bg-amber-100 text-amber-800 border-amber-200",
//           label: "Pending Clearance"
//         }
//       };

//       return status ? (
//         <Badge variant="outline" className={`gap-1.5 text-xs py-1 px-2 ${statusConfig[status as keyof typeof statusConfig]?.className || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
//           {statusConfig[status as keyof typeof statusConfig]?.icon}
//           {statusConfig[status as keyof typeof statusConfig]?.label || status}
//         </Badge>
//       ) : (
//         <span className="text-gray-400 text-sm">-</span>
//       );
//     },
//   },
//   {
//     accessorKey: "actions",
//     header: () => (
//       <div className="flex items-center gap-1 text-slate-700 font-medium">
//         <Eye className="h-5 w-5 text-purple-500" />
//         <span className="text-sm">Actions</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const student = row.original;
//       return (
//         <Link to={`${student.id}`} className="flex">
//           <Button 
//             variant="outline"  
//             className="border-gray-300 hover:bg-purple-50 hover:text-purple-600 text-xs h-8 px-3"
//             size="sm"
//           >
//             View Details
//           </Button>
//         </Link>
//       );
//     },
//   },
// ];