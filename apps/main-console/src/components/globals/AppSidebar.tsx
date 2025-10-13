import * as React from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Settings,
  Home,
  LayoutList,
  LayoutDashboard,
  Megaphone,
  UserCog,
  Plus,
  ChevronDown,
  Calendar,
  FileText,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { GalleryVerticalEnd } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { SearchStudentModal } from "./SearchStudentModal";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Remove hardcoded academic years - now using Redux state

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
    // { title: "Resources", url: "/dashboard/resources", icon: Boxes },
    { title: "Academic Setup", url: "/dashboard/academic-year-setup", icon: LayoutList },
    { title: "CU Registration", url: "/dashboard/cu-registration", icon: FileText },
    { title: "Exam Management", url: "/dashboard/exam-management", icon: GraduationCap },
    { title: "Real Time Tracker", url: "/dashboard/realtime-tracker", icon: ClipboardList },
    // { title: "Admissions & Fees", url: "/dashboard/admissions-fees", icon: BadgeIndianRupee },
    // { title: "Batches", url: "/dashboard/batches", icon: Layers3 },
    // { title: "Attendance & Timetable", url: "/dashboard/attendance-timetable", icon: CalendarClock },
    // { title: "Exam Management", url: "/dashboard/exam-management", icon: ClipboardList },
    // { title: "Students", url: "/dashboard/students", icon: Users },
    // { title: "Marksheets", url: "/dashboard/marksheets", icon: Users },
    // { title: "Library", url: "/dashboard/library", icon: Library },
    // { title: "Events", url: "/dashboard/events", icon: PartyPopper },
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
  const { settings } = useSettings();
  const currentPath = location.pathname;
  const { user, accessToken, isReady } = useAuth();
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const [isSearchActive, setIsSearchActive] = React.useState(false);

  // Academic Year Management with Redux
  const {
    currentAcademicYear,
    availableAcademicYears,
    loading: academicYearLoading,
    error: academicYearError,
    loadAcademicYears,
    setCurrentYear,
  } = useAcademicYear();

  // Load academic years only when access token is available
  React.useEffect(() => {
    if (accessToken && availableAcademicYears.length === 0) {
      loadAcademicYears();
    }
  }, [accessToken, availableAcademicYears.length, loadAcademicYears]);

  React.useEffect(() => {}, [settings]);

  // Helper to check if sidebar item is active
  function isSidebarActive(currentPath: string, itemUrl: string) {
    return currentPath === itemUrl || currentPath.startsWith(itemUrl + "/");
  }

  //   const handleLogout = async () => {
  //     try {
  //       setIsLoggingOut(true);
  //       await logout();
  //       toast.success("Logged out successfully");
  //     } catch (error) {
  //       console.error("Logout failed:", error);
  //       toast.error("Logout failed. Please try again.");
  //     } finally {
  //       setIsLoggingOut(false);
  //     }
  //   };

  // Show a lightweight skeleton while auth is bootstrapping
  if (!isReady) {
    return <div className="h-16 w-56 animate-pulse bg-muted/40 rounded-md m-2" />;
  }
  // Always render the sidebar container promptly; show skeleton while auth/user hydrate
  const showSkeleton = !accessToken || !user;

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props} className="bg-white overflow-hidden border-none">
        <SidebarHeader className="h-16 border-b border-purple-50/30 bg-gradient-to-r from-purple-900 to-purple-800 shadow-lg p-0">
          <div className=" h-full flex items-center w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-purple-700/50 transition-colors">
                  <div className="flex items-center justify-center p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Avatar className="h-8 w-8 ring-2 ring-white/20 overflow-hidden">
                      {settings?.find((ele) => ele.name == "College Logo Image")?.id ? (
                        <AvatarImage
                          src={`${import.meta.env.VITE_APP_BACKEND_URL!}/api/v1/settings/file/${settings?.find((ele) => ele.name == "College Logo Image")?.id}`}
                          alt="college-logo"
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white font-bold">
                          <GalleryVerticalEnd className="h-3 w-3" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold text-white leading-tight truncate">
                      {settings.find((ele) => ele.name === "College Abbreviation")?.value} Console Panel
                    </h1>
                    <p className="text-xs text-purple-200 truncate">
                      {academicYearLoading
                        ? "Loading..."
                        : academicYearError
                          ? "Error loading year"
                          : currentAcademicYear?.year || "Select Year"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-purple-200 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4" />
                    Select Academic Year
                  </div>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    {academicYearLoading ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading academic years...</div>
                    ) : academicYearError ? (
                      <div className="px-2 py-1.5 text-sm text-red-500">Error: {academicYearError}</div>
                    ) : availableAcademicYears.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No academic years found</div>
                    ) : (
                      availableAcademicYears.map((year) => (
                        <DropdownMenuItem
                          key={year.id}
                          onClick={() => setCurrentYear(year)}
                          className="flex items-center gap-2 cursor-pointer px-2 py-1.5"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{year.year}</span>
                          {year.isCurrentYear === true && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              Current
                            </Badge>
                          )}
                          {currentAcademicYear?.id === year.id && (
                            <div className="ml-auto h-2 w-2 bg-purple-600 rounded-full" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 border-none bg-purple-800/95">
          {showSkeleton ? (
            <div className="p-3 space-y-3">
              <div className="h-8 w-3/4 bg-purple-700/40 rounded animate-pulse" />
              <div className="h-8 w-2/3 bg-purple-700/40 rounded animate-pulse" />
              <div className="h-8 w-1/2 bg-purple-700/40 rounded animate-pulse" />
              <div className="h-8 w-1/3 bg-purple-700/40 rounded animate-pulse" />
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between ">
              <div className="">
                <div className="flex flex-col h-full justify-between">
                  {/* Academic Year Setup */}
                  <div className="my-4 mb-6 border mx-2 rounded-l-md">
                    <NavItem
                      key={"Academic Year Setup"}
                      icon={<Plus className="h-5 w-5" />}
                      href={"/dashboard/academic-year-setup"}
                    >
                      <span className="text">New Academic Setup</span>
                    </NavItem>
                  </div>

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
                            : isSidebarActive(currentPath, item.url))
                        }
                      >
                        <span className="text-lg">{item.title}</span>
                      </NavItem>
                    ))}
                  </div>
                  {/* Masters Section */}
                  <div className="mb-4 ">
                    <h3 className="mb-2 px-3 pt-3 text-xs font-medium text-purple-200 uppercase tracking-wider">
                      Masters
                    </h3>
                    <div>
                      {data.navMain.map((item) => (
                        <NavItem
                          key={item.title}
                          icon={item.icon && <item.icon className="h-5 w-5" />}
                          href={item.url}
                          isActive={!isSearchActive && isSidebarActive(currentPath, item.url)}
                        >
                          <span className="text-[14px]">{item.title}</span>
                        </NavItem>
                      ))}
                    </div>
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
          )}
        </SidebarContent>

        <SidebarFooter className="mt-auto border-t border-purple-500 bg-purple-800/95">
          {/* <DropdownMenu>
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
          </DropdownMenu> */}
          <div className="font-bold">
            <p className="text-xs text-center text-purple-100 space-x-1">
              <Badge variant="secondary" className="">
                academic360
              </Badge>
              <Badge variant="secondary">v1.0.0</Badge>
            </p>
          </div>
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
          : "text-white hover:bg-purple-700/80 hover:text-white",
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
