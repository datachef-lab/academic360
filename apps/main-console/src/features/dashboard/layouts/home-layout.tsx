// import { Link, Outlet, useLocation } from "react-router-dom";
// import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { Separator } from "@/components/ui/separator";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { AppSidebar } from "@/components/globals/AppSidebar";
// // import { ModeToggle } from "@/components/globals/ModeToggle";
// import styles from "@/styles/HomeLayout.module.css";
// // import NotifcationPanel from "../globals/NotifcationPanel";
// // import GlobalSearch from "../globals/GlobalSearch";
// import { ThemeProvider } from "@/providers/ThemeProvider";
// import { useIsMobile } from "@/hooks/useMobile";
// import {
//   Home,
//   Boxes,
//   LayoutList,
//   BadgeIndianRupee,
//   Layers3,
//   ClipboardList,
//   Users,
//   Library,
//   CalendarClock,
//   PartyPopper,
//   LayoutDashboard,
//   Megaphone,
//   UserCog,
//   Settings,
//   Search,
//   BookOpen,
// } from "lucide-react";
// import { NavUser } from "../../../components/globals/NavUser";
// import { Button } from "@/components/ui/button";
// import {
//   CommandDialog,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import { useState, useEffect } from "react";

// // Match sidebar route paths (without "/dashboard") to icons
// const pathIconMap: Record<string, React.ElementType> = {
//   dashboard: Home,
//   resources: Boxes,
//   "courses-subjects": LayoutList,
//   "admissions-fees": BadgeIndianRupee,
//   batches: Layers3,
//   "exam-management": ClipboardList,
//   students: Users,
//   lib: Library,
//   "attendance-timetable": CalendarClock,
//   event: PartyPopper,
//   apps: LayoutDashboard,
//   "notice-management": Megaphone,
//   "faculty-staff": UserCog,
//   settings: Settings,
// };

// // Search data
// const searchData = [
//   {
//     title: "Dashboard",
//     description: "Main dashboard overview",
//     href: "/dashboard",
//     icon: Home,
//     category: "Navigation",
//   },
//   {
//     title: "Academic Setup",
//     description: "Configure academic year settings",
//     href: "/dashboard/academic-year-setup",
//     icon: LayoutList,
//     category: "Academic",
//   },
//   {
//     title: "Students",
//     description: "Manage student records",
//     href: "/dashboard/students",
//     icon: Users,
//     category: "Management",
//   },
//   {
//     title: "Courses & Subjects",
//     description: "Manage courses and subjects",
//     href: "/dashboard/courses-subjects",
//     icon: BookOpen,
//     category: "Academic",
//   },
//   {
//     title: "Exam Management",
//     description: "Handle exam schedules and results",
//     href: "/dashboard/exam-management",
//     icon: ClipboardList,
//     category: "Academic",
//   },
//   {
//     title: "Settings",
//     description: "Application settings",
//     href: "/dashboard/settings",
//     icon: Settings,
//     category: "System",
//   },
//   {
//     title: "Notice Management",
//     description: "Manage notices and announcements",
//     href: "/dashboard/notices",
//     icon: Megaphone,
//     category: "Communication",
//   },
//   {
//     title: "Faculty & Staff",
//     description: "Manage faculty and staff records",
//     href: "/dashboard/faculty-staff",
//     icon: UserCog,
//     category: "Management",
//   },
// ];

// export default function HomeLayout() {
//   const location = useLocation(); // Get current route location
//   const pathSegments = location.pathname.split("/").filter(Boolean); // Split the path into segments
//   const [open, setOpen] = useState(false);
//   const isMobile = useIsMobile();

//   // Keyboard shortcut handler
//   useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         e.preventDefault();
//         setOpen((open) => !open);
//       }
//     };

//     document.addEventListener("keydown", down);
//     return () => document.removeEventListener("keydown", down);
//   }, []);

//   return (
//     <ThemeProvider defaultTheme="light">
//       <SidebarProvider className="w-screen overflow-x-hidden">
//         <AppSidebar />
//         <SidebarInset className="w-[100%] overflow-hidden max-h-screen">
//           <header className="flex justify-between border-b py-2 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
//             <div className="flex items-center gap-2 px-4">
//               {isMobile && (
//                 <>
//                 <SidebarTrigger className="-ml-1" />
//               </>
//               )
//                 }
//               <Separator orientation="vertical" className="mr-2 h-4" />
//               <Breadcrumb>
//                 <BreadcrumbList>
//                   <BreadcrumbItem>
//                     <BreadcrumbLink asChild>Academics</BreadcrumbLink>
//                     <BreadcrumbSeparator />
//                   </BreadcrumbItem>

//                   {/* {pathSegments.map((segment, index) => {
//                     const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

//                     return (
//                       <BreadcrumbItem key={index}>
//                         <BreadcrumbLink asChild className="text-blue-500">
//                           <Link to={path}>{segment.charAt(0).toUpperCase() + segment.slice(1)}</Link>
//                         </BreadcrumbLink>
//                         <BreadcrumbSeparator />
//                       </BreadcrumbItem>
//                     );
//                   })} */}

//                   {pathSegments.map((segment, index) => {
//                     const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
//                     const Icon = pathIconMap[segment];

//                     return (
//                       <BreadcrumbItem key={index}>
//                         <BreadcrumbLink asChild>
//                           <Link
//                             to={path}
//                             className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition-colors"
//                           >
//                             {Icon && <Icon className="w-4 h-4 text-gray-500" />}
//                             <span className="capitalize">{segment.replace(/-/g, " ")}</span>
//                           </Link>
//                         </BreadcrumbLink>
//                         <BreadcrumbSeparator />
//                       </BreadcrumbItem>
//                     );
//                   })}
//                 </BreadcrumbList>
//               </Breadcrumb>
//             </div>
//             <div className="flex items-center mr-2 gap-2">
//               {/* Search Button */}
//               <Button
//                 variant="outline"
//                 className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
//                 onClick={() => setOpen(true)}
//               >
//                 <Search className="mr-2 h-4 w-4" />
//                 <span className="hidden lg:inline-flex">Search...</span>
//                 <span className="inline-flex lg:hidden">Search</span>
//                 <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
//                   <span className="text-xs">⌘</span>K
//                 </kbd>
//               </Button>
//               <NavUser />
//               {/* <NotifcationPanel /> */}
//               {/* <ModeToggle /> */}
//             </div>
//           </header>
//           <div id={styles["shared-area"]} className="flex flex-1 flex-col gap-4 pt-0 overflow-x-hidden">
//             <Outlet />
//           </div>
//         </SidebarInset>
//       </SidebarProvider>

//       {/* Command Dialog for Spotlight Search */}
//       <CommandDialog open={open} onOpenChange={setOpen}>
//         <CommandInput placeholder="Type a command or search..." />
//         <CommandList>
//           <CommandEmpty>No results found.</CommandEmpty>
//           {Object.entries(
//             searchData.reduce(
//               (acc, item) => {
//                 const category = item.category;
//                 if (!acc[category]) {
//                   acc[category] = [];
//                 }
//                 acc[category].push(item);
//                 return acc;
//               },
//               {} as Record<string, typeof searchData>,
//             ),
//           ).map(([category, items]) => (
//             <CommandGroup key={category} heading={category}>
//               {items.map((item) => (
//                 <CommandItem
//                   key={item.href}
//                   value={item.title}
//                   onSelect={() => {
//                     setOpen(false);
//                     window.location.href = item.href;
//                   }}
//                   className="flex items-center gap-2"
//                 >
//                   <item.icon className="h-4 w-4" />
//                   <div className="flex flex-col">
//                     <span className="font-medium">{item.title}</span>
//                     <span className="text-xs text-muted-foreground">{item.description}</span>
//                   </div>
//                 </CommandItem>
//               ))}
//             </CommandGroup>
//           ))}
//         </CommandList>
//       </CommandDialog>
//     </ThemeProvider>
//   );
// }

import { Link, Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/globals/AppSidebar";
import styles from "@/styles/HomeLayout.module.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Home,
  Boxes,
  LayoutList,
  BadgeIndianRupee,
  Layers3,
  ClipboardList,
  Users,
  Library,
  CalendarClock,
  PartyPopper,
  LayoutDashboard,
  Megaphone,
  UserCog,
  Settings,
  Search,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { NavUser } from "../../../components/globals/NavUser";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";

// Match sidebar route paths to icons
const pathIconMap: Record<string, React.ElementType> = {
  dashboard: Home,
  resources: Boxes,
  "courses-subjects": LayoutList,
  "admissions-fees": BadgeIndianRupee,
  batches: Layers3,
  "exam-management": ClipboardList,
  students: Users,
  lib: Library,
  "attendance-timetable": CalendarClock,
  event: PartyPopper,
  apps: LayoutDashboard,
  "notice-management": Megaphone,
  "faculty-staff": UserCog,
  settings: Settings,
};

// Search data
const searchData = [
  {
    title: "Dashboard",
    description: "Main dashboard overview",
    href: "/dashboard",
    icon: Home,
    category: "Navigation",
  },
  {
    title: "Academic Setup",
    description: "Configure academic year settings",
    href: "/dashboard/academic-year-setup",
    icon: LayoutList,
    category: "Academic",
  },
  {
    title: "Students",
    description: "Manage student records",
    href: "/dashboard/students",
    icon: Users,
    category: "Management",
  },
  {
    title: "Courses & Subjects",
    description: "Manage courses and subjects",
    href: "/dashboard/courses-subjects",
    icon: BookOpen,
    category: "Academic",
  },
  {
    title: "Exam Management",
    description: "Handle exam schedules and results",
    href: "/dashboard/exam-management",
    icon: ClipboardList,
    category: "Academic",
  },
  {
    title: "Settings",
    description: "Application settings",
    href: "/dashboard/settings",
    icon: Settings,
    category: "System",
  },
  {
    title: "Notice Management",
    description: "Manage notices and announcements",
    href: "/dashboard/notices",
    icon: Megaphone,
    category: "Communication",
  },
  {
    title: "Faculty & Staff",
    description: "Manage faculty and staff records",
    href: "/dashboard/faculty-staff",
    icon: UserCog,
    category: "Management",
  },
];

export default function HomeLayout() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider className="w-screen overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="w-[100%] overflow-hidden max-h-screen">
          <header className="flex items-center justify-between border-b bg-white h-16 px-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isMobile && <SidebarTrigger className="h-8 w-8 p-0" />}

              <Separator orientation="vertical" className="h-4" />

              {/* Mobile breadcrumb - show current page only */}
              {isMobile ? (
                <div className="flex items-center gap-2 min-w-0">
                  {pathSegments.length > 0 && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const currentSegment = pathSegments[pathSegments.length - 1];
                        if (!currentSegment) return null;
                        const Icon = pathIconMap[currentSegment];
                        return (
                          <>
                            {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {currentSegment.replace(/-/g, " ")}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                // Desktop breadcrumb - show full path
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink className="text-sm text-gray-600">Academics</BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </BreadcrumbItem>

                    {pathSegments.map((segment, index) => {
                      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
                      const Icon = pathIconMap[segment];

                      return (
                        <BreadcrumbItem key={index}>
                          <BreadcrumbLink asChild>
                            <Link
                              to={path}
                              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                              <span className="capitalize">{segment.replace(/-/g, " ")}</span>
                            </Link>
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </BreadcrumbItem>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Button - Icon only for mobile, with text for desktop */}
              {isMobile ? (
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="relative h-9 justify-start rounded-lg bg-gray-50 text-sm font-normal text-gray-500 border-gray-200 hover:bg-gray-100 w-64"
                  onClick={() => setOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search...</span>
                  <kbd className="pointer-events-none absolute right-2 top-2 h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-xs font-medium text-gray-400 hidden sm:flex">
                    ⌘K
                  </kbd>
                </Button>
              )}

              <NavUser />
            </div>
          </header>

          <div id={styles["shared-area"]} className="flex flex-1 flex-col gap-4 pt-0 overflow-x-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Command Dialog for Search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(
            searchData.reduce(
              (acc, item) => {
                const category = item.category;
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(item);
                return acc;
              },
              {} as Record<string, typeof searchData>,
            ),
          ).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => {
                    setOpen(false);
                    window.location.href = item.href;
                  }}
                  className="flex items-center gap-3 py-2"
                >
                  <item.icon className="h-4 w-4 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-400 ml-auto" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </ThemeProvider>
  );
}
