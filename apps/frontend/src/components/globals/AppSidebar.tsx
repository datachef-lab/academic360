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
  
  ChevronDown,

  Home,
  LogOut,
  Boxes,
  LayoutList,
  BadgeIndianRupee,
  ClipboardList,
  Layers3,
  Users,
  Library,
  CalendarClock,
  PartyPopper,

  LayoutDashboard,
  Megaphone,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { GalleryVerticalEnd } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { UserAvatar } from "@/hooks/UserAvatar";
import { SearchStudentModal } from "./SearchStudentModal";

// Navigation data
const data = {
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
      url: "/dashboard",
      icon: Home,
    },
  ],
  navMain: [
    { title: "Resources", url: "/dashboard/resources", icon: Boxes },
    { title: "Courses & Subject Design", url: "/dashboard/courses-subjects-design", icon: LayoutList },
    { title: "Admissions & Fees", url: "/dashboard/admissions-fees", icon: BadgeIndianRupee },
    { title: "Batches", url: "/dashboard/batches", icon: Layers3 },
    { title: "Attendance & Timetable", url: "/dashboard/attendance-timetable", icon: CalendarClock },
    { title: "Exam Management", url: "/dashboard/exam-management", icon: ClipboardList },
    { title: "Students", url: "/dashboard/students", icon: Users },
    { title: "Library", url: "/dashboard/library", icon: Library },
    { title: "Events", url: "/dashboard/events", icon: PartyPopper },
  ],

  navAdministration: [
    {
      title: "Apps",
      url: "/dashboard/apps",
      icon: LayoutDashboard, // new icon
    },
    {
      title: "Notice Management",
      url: "/dashboard/notices",
      icon: Megaphone, // already imported
    },
    {
      title: "Faculty & Staff",
      url: "/dashboard/faculty-staff",
      icon: UserCog, // new icon
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, logout, accessToken, displayFlag } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const [isSearchActive, setIsSearchActive] = React.useState(false);

  // Helper to check if sidebar item is active
  function isSidebarActive(currentPath: string, itemUrl: string) {
    return currentPath === itemUrl || currentPath.startsWith(itemUrl + "/");
  }

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

  if (!displayFlag || !user || !accessToken) {
    return null;
  }

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props} className="bg-white overflow-hidden border-none">
        <SidebarHeader className="p-6 border-none border-purple-500 bg-purple-800/95">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center p-3 drop-shadow-lg rounded-lg bg-purple-500">
              <GalleryVerticalEnd className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Academic360</h1>
              <p className="text-xs text-purple-100">Education Management</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-0 border-none bg-purple-800/95">
          <div className="mt-2 mb-4 flex flex-col justify-between ">
            <div>
              {/* Dashboard Link */}
              <div className="mb-4">
                {data.navDash.map((item) => (
                  <NavItem
                    key={item.title}
                    icon={item.icon && <item.icon className="h-5 w-5" />}
                    href={item.url}
                    isActive={
                      !isSearchActive &&
                      (item.url === "/dashboard"
                        ? currentPath === "/dashboard"
                        : isSidebarActive(currentPath, item.url)
                      )
                    }
                  >
                    <span className="text-lg">{item.title}</span>
                  </NavItem>
                ))}
              </div>
              {/* Masters Section */}
              <div className="mb-4">
                <h3 className="mb-2 px-3 pt-3 text-xs font-medium text-purple-200 uppercase tracking-wider">Masters</h3>
                <div>
                  {data.navMain.map((item) => (
                    <NavItem
                      key={item.title}
                      icon={item.icon && <item.icon className="h-5 w-5" />}
                      href={item.url}
                      isActive={!isSearchActive && isSidebarActive(currentPath, item.url)}
                    >
                      <span className="text-base">{item.title}</span>
                    </NavItem>
                  ))}
                </div>
              </div>
            </div>
            {/* Administration */}
            <div className="my-14">
              <h3 className="mb-2 px-3 pt-3 text-xs font-medium text-purple-200 uppercase tracking-wider">
                Administration
              </h3>
              <div className="p">
                {data.navAdministration.map((item) => {
                  const url = item.url ?? "";
                  const isActive = !isSearchActive && isSidebarActive(currentPath, url);

                //   if (item.isModal) {
                //     return (
                //       <div
                //         key={item.title}
                //         onClick={() => {
                //           setIsSearchModalOpen(true);
                //           setIsSearchActive(true);
                //         }}
                //         className={cn(
                //           "group flex items-center transition-all duration-100 px-6 py-3 text-sm font-medium relative cursor-pointer",
                //           isSearchActive
                //             ? "bg-white hover:text-purple-600 font-semibold text-purple-600 rounded-l-full shadow-lg"
                //             : "text-white hover:text-white",
                //         )}
                //       >
                //         <div className="flex items-center gap-3">
                //           <span className={cn("h-5 w-5", isSearchActive ? "text-purple-600" : "text-white")}>
                //             {item.icon && <item.icon className="h-5 w-5" />}
                //           </span>
                //           <span className="text-base">{item.title}</span>
                //         </div>
                //       </div>
                //     );
                //   }

                  return (
                    <NavItem
                      key={item.title}
                      icon={item.icon && <item.icon className="h-5 w-5" />}
                      href={url}
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
              <div className="p-1 cursor-pointer transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <UserAvatar user={{ ...user, id: String(user.id) }} className="" />
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

      {/* Search Student Modal */}
      <SearchStudentModal
        open={isSearchModalOpen}
        onOpenChange={(open) => {
          setIsSearchModalOpen(open);
          if (!open) {
            setIsSearchActive(false);
          }
        }}
      />
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

export function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        " border border-transparent group flex items-center transition-all duration-150 px-6 py-1 hover:border-slate-50 text-sm font-medium relative rounded-l-md",
        isActive
          ? "bg-white hover:text-purple-600 font-semibold text-purple-600 shadow-lg"
          : "text-white hover:bg-purple-700/80 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <span className={cn("h-5 w-5", isActive ? "text-purple-600" : "text-white group-hover:text-white")}>
          {icon}
        </span>
        <span className="text-inherit truncate">{children}</span>
      </div>
    </Link>
  );
}

