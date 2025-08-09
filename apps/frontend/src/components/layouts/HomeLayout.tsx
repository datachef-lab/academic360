import { Link, Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/globals/AppSidebar";
// import { ModeToggle } from "@/components/globals/ModeToggle";
import styles from "@/styles/HomeLayout.module.css";
// import NotifcationPanel from "../globals/NotifcationPanel";
// import GlobalSearch from "../globals/GlobalSearch";
import { ThemeProvider } from "@/providers/ThemeProvider";
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
} from "lucide-react";
import { NavUser } from "../globals/NavUser";

// Match sidebar route paths (without "/dashboard") to icons
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

export default function HomeLayout() {
  const location = useLocation(); // Get current route location
  const pathSegments = location.pathname.split("/").filter(Boolean); // Split the path into segments

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider className="w-screen overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="w-[100%] overflow-hidden max-h-screen">
          <header className="flex justify-between border-b py-2 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              {/* <SidebarTrigger className="-ml-1" /> */}
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>Academics</BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </BreadcrumbItem>

                  {/* {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                    return (
                      <BreadcrumbItem key={index}>
                        <BreadcrumbLink asChild className="text-blue-500">
                          <Link to={path}>{segment.charAt(0).toUpperCase() + segment.slice(1)}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </BreadcrumbItem>
                    );
                  })} */}

                  {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
                    const Icon = pathIconMap[segment];

                    return (
                      <BreadcrumbItem key={index}>
                        <BreadcrumbLink asChild>
                          <Link
                            to={path}
                            className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                            <span className="capitalize">{segment.replace(/-/g, " ")}</span>
                          </Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </BreadcrumbItem>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center mr-2 gap-2">
              {/* <GlobalSearch /> */}
              <NavUser />
              {/* <NotifcationPanel /> */}
              {/* <ModeToggle /> */}
            </div>
          </header>
          <div id={styles["shared-area"]} className="flex flex-1 flex-col gap-4 pt-0 overflow-x-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
