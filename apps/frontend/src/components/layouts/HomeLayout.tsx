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
import { ModeToggle } from "@/components/globals/ModeToggle";
import styles from "@/styles/HomeLayout.module.css";
import NotifcationPanel from "../globals/NotifcationPanel";
import GlobalSearch from "../globals/GlobalSearch";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function HomeLayout() {
  const location = useLocation(); // Get current route location
  const pathSegments = location.pathname.split("/").filter(Boolean); // Split the path into segments

  return (
    <ThemeProvider>
      <SidebarProvider className="w-screen overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="w-[100%] px-2 pr-5">
          <header className="flex justify-between border-b py-2 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>Academics</BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </BreadcrumbItem>

                  {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                    return (
                      <BreadcrumbItem key={index}>
                        <BreadcrumbLink asChild className="text-blue-500">
                          <Link to={path}>{segment.charAt(0).toUpperCase() + segment.slice(1)}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </BreadcrumbItem>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <NotifcationPanel />
              <ModeToggle />
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
