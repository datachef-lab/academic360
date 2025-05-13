// import * as React from "react";
// import {
//   BookCheck,
//   BookOpen,

//   ChevronDown,
//   ClipboardPenLine,
//   DownloadCloud,
//   FileUser,
//   GalleryVerticalEnd,

//   Home,

//   LogOut,
//   MapPinned,
//   Notebook,
//   Settings,
//   User,
//   UserPlus,
//   UserRoundPlus,
//   UserRoundSearch,

// } from "lucide-react";
// import { Link, useLocation } from "react-router-dom";

// import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { cn } from "@/lib/utils";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// // This is sample data.
// const data = {
//   user: {
//     name: "shadcn",
//     email: "m@example.com",
//     avatar: "",
//   },
//   teams: [
//     {
//       name: "academic360",
//       logo: GalleryVerticalEnd,
//       plan: "v1.4.0-alpha",
//     },
//     {
//       name: "Issues",
//       logo: GalleryVerticalEnd,
//       plan: "#development-mode",
//     },
//     {
//       name: "Leaves",
//       logo: GalleryVerticalEnd,
//       plan: "#development-mode",
//     },
//     {
//       name: "Notices",
//       logo: GalleryVerticalEnd,
//       plan: "#development-mode",
//     },
//   ],
//   navDash:[
//     {
//       title: "Dashboard",
//       url: "/home",
//       icon: Home,
//     },
//   ],
//   navMain: [

//     {
//       title: "Admission & Fees Dept",
//       url: "/home/admission-fees",
//       icon: UserPlus,
//       // items: [
//       //   { title: "Dashboard", url: "/home/admission" },
//       //   { title: "Applications", url: "/home/applications" },
//       //   { title: "New Admission", url: "/home/new-admission" },
//       //   { title: "Fee Management", url: "/home/fee-management" },
//       //   { title: "Reports", url: "/home/admission-reports" },
//       // ],
//     },
//     // AdmissionAndFess
//     {
//       title: "Courses & Subject",
//       url: "/home/courses-subjects",
//       icon: Notebook,
//     },
//     {
//       title: "Exam Management",
//       url: "/home/exam-management",
//       icon: BookCheck,
//       // items: [
//       //   {
//       //     title: "Examboard",
//       //     url: "/home/examboard",
//       //   },
//       // ],
//     },

//     {
//       title: "Library",
//       url: "/home/lib",
//       icon: BookOpen,
//       // items: [
//       //   { title: "Dashboard", url: "/home/lib" },
//       //   { title: "Book Catalog", url: "/home/catalog" },
//       //   { title: "Issue/Return", url: "/home/issued-book" },
//       //   { title: "Fines", url: "/home/fine-management" },
//       //   { title: "Reports", url: "/home/lib-report" },
//       // ],
//     },

//     {
//       title: "Event",
//       url: "/home/event",
//       icon: MapPinned,
//     },
//     {
//       title: "Settings",
//       url: "/home/settings",
//       icon: Settings,
//     },

//   ],
//   navStudent:[
//     // {
//     //   title: "Student",
//     //   url: "/home/academics",
//     //   icon: GraduationCap,
//     // },
//     {
//       title: "Add Student",
//       url: "/home/add-student",
//       icon: UserRoundPlus,
//     },
//         {
//           title: "Add Marksheet",
//           url: "/home/add-marksheet",
//           icon: ClipboardPenLine,
//         },

//         {
//           title: "Search Student",
//           url: "/home/search-students",
//           icon: UserRoundSearch,
//         },
//         {
//           title: "Get Reports",
//           url: "/home/student-reports",
//           icon: FileUser,
//         },
//         {
//           title: "Downloads",
//           url: "/home/downloads",
//           icon: DownloadCloud,
//         },

//   ]
// };

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   const location = useLocation();
//   const currentPath = location.pathname;

//   // Get the base path segment after /home/

//   // const pathSegments = currentPath.split("/").filter(Boolean);
//   // const basePath = pathSegments.length > 1 ? pathSegments[1] : "";

//   const handleLogout = () => {
//     console.log("User logged out");
//     // Add your logout logic here
//   };

//   return (
//     <Sidebar collapsible="icon" {...props} className="bg-white border-r">
//       <SidebarHeader className="p-4 border-b border-gray-100">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100">
//             <GalleryVerticalEnd className="h-6 w-6 text-purple-600" />
//           </div>
//           <div>
//             <h1 className="text-lg font-semibold text-gray-800">Academic360</h1>
//             <p className="text-xs text-gray-500">Education Management</p>
//           </div>
//         </div>
//       </SidebarHeader>

//       <SidebarContent className="p-0">
//         <div className="mt-4 ">
//           {/* Dashboard Link (from navDash) */}
//           <div className="mb-4 ">
//           {data.navDash.map((item) => (
//             <NavItem
//               key={item.title}
//               icon={item.icon && <item.icon className="h-5 w-5" />}
//               href={item.url}
//               isActive={currentPath === item.url}
//             >
//               <span className="text-base">{item.title}</span>
//             </NavItem>
//           ))}
//           </div>

//           {/* Administration Section */}
//           <div className="mb-4">
//           <h3 className="mb-2 px-4 text-xs font-medium text-gray-500">Administration</h3>
//           <div className="pl-2">
//             {/* {data.navMain.map((item) => {
//               const itemBaseSegment = item.url.split("/").filter(Boolean)[1] || "";
//               const isBaseActive = itemBaseSegment === basePath;
//               const isExactMatch = currentPath === item.url;
//               const hasActiveSubItem = Array.isArray(item.items) &&
//                 item.items.some((subItem) => currentPath === subItem.url);
//               const showSubItems = isBaseActive || hasActiveSubItem;

//               return (
//                 <React.Fragment key={item.title}>
//                   <NavItem
//                     icon={item.icon && <item.icon className="h-5 w-5" />}
//                     href={item.url}
//                     isActive={isExactMatch && (!item.items || item.items.length === 0)}
//                   >
//                     {item.title}
//                   </NavItem>

//                   {showSubItems && item.items && item.items.length > 0 && (
//                     <div className="bg-gray-50 pl-4">
//                       {item.items.map((subItem) => (
//                         <SubNavItem
//                           key={subItem.title}
//                           href={subItem.url}
//                           isActive={currentPath === subItem.url}
//                         >
//                           {subItem.title}
//                         </SubNavItem>
//                       ))}
//                     </div>
//                   )}
//                 </React.Fragment>
//               );
//             })} */}
//               {data.navMain.map((item) => (
//             <NavItem
//               key={item.title}
//               icon={item.icon && <item.icon className="h-5 w-5" />}
//               href={item.url}
//               isActive={currentPath === item.url}
//             >
//               <span className="">{item.title}</span>
//             </NavItem>
//           ))}
//           </div>
//           </div>

//           {/* Student Section */}
//           <div className="mb-4">
//           <h3 className="mb-2 px-4 text-xs font-medium text-gray-500">
//              Student
//           </h3>
//           <div className="pl-2">
//           {data.navStudent.map((item) => {
//   const isActive = currentPath === item.url;

//   return (
//     <NavItem
//       key={item.title}
//       icon={item.icon && <item.icon className="h-5 w-5 " />}
//       href={item.url}
//       isActive={isActive}
//     >
//       {item.title}
//     </NavItem>
//   );
// })}

//           </div>
//           </div>
//         </div>
//       </SidebarContent>

//       <SidebarFooter className="mt-auto border-t border-gray-100">
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <div className="p-4 cursor-pointer hover:bg-gray-50">
//               <div className="flex items-center gap-3">
//                 <Avatar className="h-9 w-9 border-2 border-green-500">
//                   <AvatarImage src={data.user.avatar || undefined} alt={data.user.name} />
//                   <AvatarFallback className="bg-slate-100 text-slate-800">SH</AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1">
//                   <div className="font-medium text-gray-700">{data.user.name}</div>
//                   <div className="text-xs text-gray-500">{data.user.email}</div>
//                 </div>
//                 <ChevronDown className="h-4 w-4 text-gray-400" />
//               </div>
//             </div>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-56">
//             <DropdownMenuItem className="cursor-pointer">
//               <User className="mr-2 h-4 w-4" />
//               <span>Profile</span>
//             </DropdownMenuItem>
//             <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
//               <LogOut className="mr-2 h-4 w-4" />
//               <span>Logout</span>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </SidebarFooter>
//     </Sidebar>
//   );
// }

// function NavItem({
//   href,
//   icon,
//   children,
//   isActive,
// }: {
//   href: string;
//   icon: React.ReactNode;
//   children: React.ReactNode;
//   isActive?: boolean;
// }) {
//   return (
//     <Link
//       to={href}
//       className={cn(
//         "group flex items-center justify-between px-4 py-2.5 text-sm font-medium relative",
//         isActive ? "bg-purple-100 text-purple-800 border-l-4 border-purple-600" : "text-gray-700 hover:bg-gray-100",
//       )}
//     >
//       <div className="flex items-center gap-3">
//         <span className={cn("h-5 w-5", isActive ? "text-purple-800" : "text-gray-500 group-hover:text-gray-700")}>
//           {icon}
//         </span>
//         <span>{children}</span>
//       </div>

//       {isActive && (
//         <div className="absolute right-3">
//           <div className="h-2 w-2 rounded-full bg-purple-600"></div>
//         </div>
//       )}
//     </Link>
//   );
// }

// // function SubNavItem({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) {
// //   return (
// //     <Link
// //       to={href}
// //       className={cn(
// //         "group flex items-center px-4 py-2.5 text-sm relative",
// //         isActive
// //           ? "bg-purple-100 text-purple-800 font-medium border-l-4 border-purple-600"
// //           : "text-gray-600 hover:bg-gray-100",
// //       )}
// //     >
// //       <div className="flex items-center gap-3">
// //         <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-purple-600" : "bg-gray-400")}></div>
// //         <span>{children}</span>
// //       </div>

// //       {isActive && (
// //         <div className="absolute right-3">
// //           <div className="h-2 w-2 rounded-full bg-purple-600"></div>
// //         </div>
// //       )}
// //     </Link>
// //   );
// // }


import * as React from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,

  Settings,
  BookCheck,
  BookOpen,
  ChevronDown,
  ClipboardPenLine,
  DownloadCloud,
  FileUser,
  Home,
  LogOut,
  MapPinned,
  Notebook,
  UserPlus,
  UserRoundPlus,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { GalleryVerticalEnd } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { UserAvatar } from "@/hooks/UserAvatar";

// Navigation data (simplified example)
const data = {
  // user: {
  //   name: "shadcn",
  //   email: "m@example.com",
  //   avatar: "",
  // },
  teams: [
    {
      name: "academic360",
      logo: GalleryVerticalEnd,
      plan: "v1.4.0-alpha",
    },
    {
      name: "Issues",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
    {
      name: "Leaves",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
    {
      name: "Notices",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
  ],
  navDash: [
    {
      title: "Dashboard",
      url: "/home",
      icon: Home,
    },
  ],
  navMain: [
    
    {
      title: "Admission & Fees",
      url: "/home/admission-fees",
      icon: UserPlus,
    },

    {
      title: "Courses & Subject",
      url: "/home/courses-subjects",
      icon: Notebook,
    },

    {
      title: "Exam Management",
      url: "/home/exam-management",
      icon: BookCheck,
    },

    {
      title: "Library",
      url: "/home/lib",
      icon: BookOpen,
      // items: [
      //   { title: "Dashboard", url: "/home/lib" },
      //   { title: "Book Catalog", url: "/home/catalog" },
      //   { title: "Issue/Return", url: "/home/issued-book" },
      //   { title: "Fines", url: "/home/fine-management" },
      //   { title: "Reports", url: "/home/lib-report" },
      // ],
    },
 
    {
      title: "Event",
      url: "/home/event",
      icon: MapPinned,
    },
    {
      title: "Settings",
      url: "/home/settings",
      icon: Settings,
    },
  ],
  navStudent:[
    {
      title: "Add Student",
      url: "/home/add-student",
      icon: UserRoundPlus,
    },
        {
          title: "Add Marksheet",
          url: "/home/add-marksheet",
          icon: ClipboardPenLine,
        },
       
        {
          title: "Search Student",
          url: "/home/search-students",
          icon: UserRoundSearch,
        },
        {
          title: "Get Reports",
          url: "/home/student-reports",
          icon: FileUser,
        },
        {
          title: "Downloads",
          url: "/home/downloads",
          icon: DownloadCloud,
        },
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, logout, accessToken, displayFlag } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't render if auth isn't ready
  if (!displayFlag || !user || !accessToken) {
    return null;
  }

  return (
    <div className="">
          <div className="">
    <Sidebar collapsible="icon" {...props} className="bg-white overflow-hidden border-none">
      <SidebarHeader className="p-6 border-none border-purple-500 bg-purple-800/95">
        <Link to="/home" className="flex items-center gap-3">
          <div className="flex  items-center justify-center p-3 drop-shadow-lg rounded-lg bg-purple-500">
            <GalleryVerticalEnd className="h-6 w-6 text-white" />
            
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Academic360</h1>
            <p className="text-xs text-purple-100">Education Management</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-0 border-none bg-purple-800/95">
        <div className="mt-2">
          {/* Dashboard Link (from navDash) */}
          <div className="mb-4 pl-5">
            {data.navDash.map((item) => (
              <NavItem
                key={item.title}
                icon={item.icon && <item.icon className="h-5 w-5" />}
                href={item.url}
                isActive={currentPath === item.url}
              >
                <span className="text-lg">{item.title}</span>
              </NavItem>
            ))}
          </div>

          {/* Administration Section */}
          <div className="mb-4">
            <h3 className="mb-2 px-7 text-xs font-medium text-purple-200 uppercase tracking-wider">Administration</h3>
            <div className="pl-6  ">
              {data.navMain.map((item) => (
                <NavItem
                  key={item.title}
                  icon={item.icon && <item.icon className="h-5 w-5" />}
                  href={item.url}
                  isActive={currentPath === item.url}
                >
                  <span className="text-base">{item.title}</span>
                </NavItem>
              ))}
            </div>
          </div>

          {/* Student Section */}
          <div className="mb-4">
            <h3 className="mb-2 px-7 text-xs font-medium text-purple-200 uppercase tracking-wider">Student</h3>
            <div className="pl-6 ">
              {data.navStudent.map((item) => {
                const isActive = currentPath === item.url;

                return (
                  <NavItem
                    key={item.title}
                    icon={item.icon && <item.icon className="h-5 w-5" />}
                    href={item.url}
                    isActive={isActive}
                  >
                    <span className="text-base">{item.title}</span>
                  </NavItem>
                );
              })}
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-purple-500 bg-purple-800/95">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className=" p-1 cursor-pointer  transition-colors duration-200">
              <div className="flex items-center gap-3">
                <UserAvatar user={{ ...user, id: String(user.id) }}  className="" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate">{user.name || "User"}</div>
                  <div className="text-xs text-purple-200 truncate">{user.email || "email@example.com"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-purple-200 flex-shrink-0" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <p>loading...</p> : <LogOut className="mr-2 h-4 w-4" />}
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>

    </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}
function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center transition-all duration-1100 px-6 py-3 text-sm font-medium relative",
        isActive
          ? "bg-white hover:text-purple-600 font-semibold text-purple-600 rounded-l-full shadow-lg"
          : "text-white hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("h-5 w-5", isActive ? "text-purple-600" : "text-white")}>
          {icon}
        </span>
        <span className="text-inherit">{children}</span>
      </div>
    </Link>
  );
}
