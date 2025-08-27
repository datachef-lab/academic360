// // import { ColumnDef } from "@tanstack/react-table";
// // import ActionMenu from "@/components/tables/users/ActionMenu";
// // import { User } from "@/types/user/user";
// // import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
// // import { Checkbox } from "@/components/ui/checkbox";

// // import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// // import { BookUser } from "lucide-react";

// // export const userColumns: ColumnDef<User>[] = [
// //   {
// //     id: "select",
// //     header: ({ table }) => (
// //       <Checkbox
// //         checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
// //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
// //         aria-label="Select all"
// //       />
// //     ),
// //     cell: ({ row }) => (
// //       <Checkbox
// //         checked={row.getIsSelected()}
// //         onCheckedChange={(value) => row.toggleSelected(!!value)}
// //         aria-label="Select row"
// //       />
// //     ),
// //     enableSorting: false,
// //     enableHiding: false,
// //   },
// //   // {
// //   //   accessorKey: "name",
// //   //   header: ({ column }) => {
// //   //     return <DataTableColumnHeader column={column} title="Name" />;
// //   //   },
// //   // },
// //   {
// //       accessorKey: "name",
// //       header: () => (
// //         <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
// //           <BookUser className="h-5 w-5 text-purple-600" />
// //           <span>Name</span>
// //         </div>
// //       ),
// //       cell: ({ row }) => {
// //         const name = row.original.name;
        
// //         const stringToColor = (str: string) => {
// //           let hash = 0;
// //           for (let i = 0; i < str.length; i++) {
// //             hash = str.charCodeAt(i) + ((hash << 5) - hash);
// //           }
// //           return `hsl(${hash % 360}, 70%, 60%)`;
// //         };
      
// //         const bgColor = stringToColor(name);
      
// //         return (
// //           <div className="flex items-center justify-center">
// //             <Avatar className="h-8 w-8">
// //               <AvatarFallback style={{ backgroundColor: bgColor }}>
// //                 {name.charAt(0).toUpperCase()}
// //               </AvatarFallback>
// //             </Avatar>
// //             <div className="ml-4">
// //               <div className="text-sm font-medium text-gray-900">{name}</div>
// //             </div>
// //           </div>
// //         );
// //       },
// //     },
// //   {
// //     accessorKey: "email",
// //     header: ({ column }) => {
// //       return <DataTableColumnHeader column={column} title="Email" />;
// //     },
// //   },
// //   {
// //     accessorKey: "type",
// //     header: "Type",
// //   },
// //   {
// //     accessorKey: "phone",
// //     header: "Phone",
// //   },
// //   {
// //     accessorKey: "whatsappNumber",
// //     header: "WhatsApp No.",
// //   },
// //   {
// //     header: "Actions",
// //     cell: ({ row }) => {
// //       return <ActionMenu user={row.original} />},
     
// //     },
 
// // ];
import { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/components/tables/users/ActionMenu";
import { User } from "@/types/user/user";
// import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
// import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookUser, 
  Mail, 
  Smartphone, 
  MessageSquare,
  User as UserIcon,
  Eye,

  Shield
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const userColumns: ColumnDef<User>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="border-gray-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
       
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="border-gray-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center  justify-start pl-5 gap-2 text-slate-800 font-semibold">
        <BookUser className="h-5 w-5 text-purple-600" />
        <span>Name</span>
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
        <div className="flex items-center whitespace-nowrap justify-start">
        <Avatar className="h-9 w-9 border border-purple-100/50 shadow-sm">
          <AvatarFallback 
            style={{ 
              backgroundColor: bgColor,
              color: 'white',
              fontWeight: 600
            }}
          >
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="ml-2">
          <div className="text-sm font-semibold text-gray-800">{name}</div>
         
        </div>
      </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Mail className="h-5 w-5 text-purple-600" />
        <span>Email</span>
      </div>
    ),
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <p className="text-sm">{email || "-"}</p>;
    },
  },
  {
    accessorKey: "type",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <UserIcon className="h-5 w-5 text-purple-600" />
        <span>Type</span>
      </div>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      
      const typeBadges = {
        ADMIN: {
   icon: <Shield className="h-3.5 w-3.5" />,
          className: "bg-red-100/50 text-red-800 border border-red-100 hover:bg-red-100",
          label: "Admin",
        },
      
        STUDENT: {
    icon: <BookUser className="h-3.5 w-3.5" />,
          className: "bg-green-100/50 text-green-800 border border-green-200 hover:bg-green-100",
          label: "Student",
        },
       
      };
  
      const config = typeBadges[type as keyof typeof typeBadges] || {
  icon: <UserIcon className="h-3.5 w-3.5" />,
        className: "bg-gray-100/50 text-gray-800 hover:bg-gray-100",
        label: type || 'Unknown'
      };
  
      return (
        <Badge className={` gap-1 px-3 py-1  text-xs font-medium ${config.className}`}>
   {config.icon}        
  {config.label}
        </Badge>
      );
    }
  },

  // {
  //   accessorKey: "type",
  //   header: () => (
  //     <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
  //       <UserIcon className="h-5 w-5 text-purple-600" />
  //       <span>Type</span>
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const type = row.getValue("type") as string;
      
  //     const typeBadges = {
  //       ADMIN: {
  //         icon: <Shield className="h-3.5 w-3.5" />,
  //         className: "bg-red-500/10 text-red-600 border-red-200",
  //         label: "Admin",
  //       },
  //       FACULTY: {
  //         icon: <GraduationCap className="h-3.5 w-3.5" />,
  //         className: "bg-blue-500/10 text-blue-600 border-blue-200",
  //         label: "Faculty",
  //       },
  //       STUDENT: {
  //         icon: <BookUser className="h-3.5 w-3.5" />,
  //         className: "bg-green-500/10 text-green-600 border-green-200",
  //         label: "Student",
  //       },
  //       STAFF: {
  //         icon: <Briefcase className="h-3.5 w-3.5" />,
  //         className: "bg-purple-500/10 text-purple-600 border-purple-200",
  //         label: "Staff",
  //       }
  //     };
  
  //     const config = typeBadges[type as keyof typeof typeBadges] || {
  //       icon: <UserIcon className="h-3.5 w-3.5" />,
  //       className: "bg-gray-500/10 text-gray-600 border-gray-200",
  //       label: type || 'Unknown'
  //     };
  
  //     return (
  //       <Badge 
  //         variant="outline"
  //         className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium ${config.className}`}
  //       >
  //         {config.icon}
  //         {config.label}
  //       </Badge>
  //     );
  //   }
  // },
  {
    accessorKey: "phone",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Smartphone className="h-5 w-5 text-purple-600" />
        <span>Phone</span>
      </div>
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return (
        <div className="flex items-center justify-center gap-2">
                       <Badge variant="outline" className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 border-blue-100">
                         
                         {phone}
                       </Badge>
                     </div>
      );
    },
  },
  {
    accessorKey: "whatsappNumber",
    header: () => (
      <div className="flex items-center justify-center gap-2 whitespace-nowrap text-slate-800 font-semibold">
        <MessageSquare className="h-5 w-5 text-purple-600" />
        <span>WhatsApp No.</span>
      </div>
    ),
 cell: ({ row }) => {
  const whatsapp = row.getValue("whatsappNumber") as string;

  if (!whatsapp) {
    return <span className="text-slate-500">-</span>;
  }

  return (
    <Badge
      variant="outline"
      className="px-2.5 py-1 text-xs bg-green-50 text-green-600 border-green-100"
    >
      {whatsapp}
    </Badge>
  );
},

  },
  {
    id: "actions",
    header: () => (
      <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
        <Eye className="h-5 w-5 text-purple-600" />
        <span>Actions</span>
      </div>
    ),
    cell: ({ row }) => {
      return <ActionMenu user={row.original} />;
    },
  },
];

// import { ColumnDef } from "@tanstack/react-table";
// import ActionMenu from "@/components/tables/users/ActionMenu";
// import { User } from "@/types/user/user";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { 
//   BookUser, 
//   Mail, 
//   Smartphone, 
//   MessageSquare,
//   User as UserIcon,
//   Eye,
//   Shield,
//   GraduationCap,
//   Briefcase
// } from 'lucide-react';
// import { Badge } from "@/components/ui/badge";

// export const userColumns: ColumnDef<User>[] = [
//   {
//     id: "select",
//     header: ({ table }) => (
//       <Checkbox
//         checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
//         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//         aria-label="Select all"
//         className="border-gray-300/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
//       />
//     ),
//     cell: ({ row }) => (
//       <Checkbox
//         checked={row.getIsSelected()}
//         onCheckedChange={(value) => row.toggleSelected(!!value)}
//         aria-label="Select row"
//         className="border-gray-300/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
//       />
//     ),
//     enableSorting: false,
//     enableHiding: false,
//   },
//   {
//     accessorKey: "name",
//     header: () => (
//       <div className="flex items-center justify-start gap-2 text-slate-700 font-medium">
//         <BookUser className="h-5 w-5 text-purple-500" />
//         <span className="text-sm font-semibold">Name</span>
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
        // <div className="flex items-center justify-start">
        //   <Avatar className="h-9 w-9 border border-purple-100/50 shadow-sm">
        //     <AvatarFallback 
        //       style={{ 
        //         backgroundColor: bgColor,
        //         color: 'white',
        //         fontWeight: 600
        //       }}
        //     >
        //       {name.charAt(0).toUpperCase()}
        //     </AvatarFallback>
        //   </Avatar>
        //   <div className="ml-3">
        //     <div className="text-sm font-semibold text-gray-800">{name}</div>
        //     <div className="text-xs text-gray-500">{row.original.email}</div>
        //   </div>
        // </div>
//       );
//     },
//   },
//   {
//     accessorKey: "email",
//     header: () => (
//       <div className="flex items-center justify-start gap-2 text-slate-700 font-medium">
//         <Mail className="h-5 w-5 text-purple-500" />
//         <span className="text-sm font-semibold">Email</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const email = row.getValue("email") as string;
//       return (
//         <div className="flex flex-col justify-start">
//           <p className="text-sm font-medium text-gray-800">{email || "-"}</p>
//           {row.original.phone && (
//             <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
//               <Smartphone className="h-3 w-3" />
//               {row.original.phone}
//             </p>
//           )}
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "type",
//     header: () => (
//       <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
//         <UserIcon className="h-5 w-5 text-purple-500" />
//         <span className="text-sm font-semibold">Role</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const type = row.getValue("type") as string;
      
//       const typeBadges = {
//         ADMIN: {
//           icon: <Shield className="h-3.5 w-3.5" />,
//           className: "bg-red-500/10 text-red-600 border-red-200",
//           label: "Admin",
//         },
//         FACULTY: {
//           icon: <GraduationCap className="h-3.5 w-3.5" />,
//           className: "bg-blue-500/10 text-blue-600 border-blue-200",
//           label: "Faculty",
//         },
//         STUDENT: {
//           icon: <BookUser className="h-3.5 w-3.5" />,
//           className: "bg-green-500/10 text-green-600 border-green-200",
//           label: "Student",
//         },
//         STAFF: {
//           icon: <Briefcase className="h-3.5 w-3.5" />,
//           className: "bg-purple-500/10 text-purple-600 border-purple-200",
//           label: "Staff",
//         }
//       };
  
//       const config = typeBadges[type as keyof typeof typeBadges] || {
//         icon: <UserIcon className="h-3.5 w-3.5" />,
//         className: "bg-gray-500/10 text-gray-600 border-gray-200",
//         label: type || 'Unknown'
//       };
  
//       return (
//         <Badge 
//           variant="outline"
//           className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${config.className}`}
//         >
//           {config.icon}
//           {config.label}
//         </Badge>
//       );
//     }
//   },
//   {
//     accessorKey: "phone",
//     header: () => (
//       <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
//         <Smartphone className="h-5 w-5 text-purple-500" />
//         <span className="text-sm font-semibold">Contact</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       const phone = row.getValue("phone") as string;
//       const whatsapp = row.getValue("whatsappNumber") as string;
      
//       return (
//         <div className="flex flex-col gap-2">
//           {phone && (
//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 border-blue-100">
//                 <Smartphone className="h-3 w-3 mr-1" />
//                 {phone}
//               </Badge>
//             </div>
//           )}
//           {whatsapp && (
//             <div className="flex items-center gap-2">
              // <Badge variant="outline" className="px-2.5 py-1 text-xs bg-green-50 text-green-600 border-green-100">
              //   <MessageSquare className="h-3 w-3 mr-1" />
              //   {whatsapp}
              // </Badge>
//             </div>
//           )}
//           {!phone && !whatsapp && <p className="text-sm text-gray-400">-</p>}
//         </div>
//       );
//     },
//   },
//   {
//     id: "actions",
//     header: () => (
//       <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
//         <Eye className="h-5 w-5 text-purple-500" />
//         <span className="text-sm font-semibold">Actions</span>
//       </div>
//     ),
//     cell: ({ row }) => {
//       return (
//         <div className="flex justify-center">
//           <ActionMenu user={row.original} />
//         </div>
//       );
//     },
//   },
// ];