"use client";

import SharedArea from "@/components/home/SharedArea";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { StudentProvider } from "@/providers/student-provider";

import { House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <StudentProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="p-3 h-screen overflow-y-scroll">
          <header className="flex h-14 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 rounded-lg border border-border bg-card shadow-sm px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800" />
              <Separator orientation="vertical" className="h-5" />
              <Breadcrumb>
                <BreadcrumbList className="text-sm">
                  <BreadcrumbItem className="hidden md:flex">
                    <Link
                      href="/dashboard"
                      className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <House size={18} />
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:flex text-gray-400" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-gray-800 dark:text-gray-200">
                      {pathname === "/dashboard"
                        ? "Dashboard"
                        : pathname
                            .split("/")
                            .pop()
                            ?.split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              {/* Right side elements can be added here */}
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 ">
            <div className="min-h-[calc(100vh-4.5rem)] flex-1 rounded-xl md:min-h-min">
              <SharedArea>{children}</SharedArea>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StudentProvider>
  );
}
