"use client";

import * as React from "react";
import {
  BookOpen,
  House,
  IndianRupee,
  Library,
  NotebookPen,
  ScrollText,
  Settings2,
  ListChecks,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

import { useStudent } from "@/providers/student-provider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { accessControl } = useStudent();
  console.log("pathname:", pathname);

  React.useEffect(() => {}, [accessControl]);

  // Define navigation items
  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: House,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: ListChecks,
      isActive: pathname === "/dashboard/attendance",
    },
    accessControl?.access_exams && {
      title: "Exams",
      url: "/dashboard/exams",
      icon: NotebookPen,
      isActive: pathname === "/dashboard/exams",
    },
    accessControl?.access_course && {
      title: "Course Catalogue",
      url: "/dashboard/course-catalogue",
      icon: BookOpen,
      isActive: pathname === "/dashboard/course-catalogue",
    },
    accessControl?.access_documents && {
      title: "Documents",
      url: "/dashboard/documents",
      icon: ScrollText,
      isActive: pathname === "/dashboard/documents",
    },
    {
      title: "Enrollment & Fees",
      url: "/dashboard/enrollment-fees",
      icon: IndianRupee,
      isActive: pathname === "/dashboard/enrollment-fees",
    },
    accessControl?.access_library && {
      title: "Library",
      url: "/dashboard/library",
      icon: Library,
      isActive: pathname === "/dashboard/library",
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: Settings2,
      isActive: pathname === "/dashboard/profile",
    },
  ].filter((ele) => !!ele);

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="xl"
              className="cursor-default hover:bg-transparent"
            >
              <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  width={32}
                  height={32}
                  src={"/besc-logo.jpeg"}
                  alt={"The Bhawanipur Education Society College Logo"}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </div>
              <div className="grid flex-1 text-left text-sm">
                <span className="truncate font-semibold text-wrap">
                  The Bhawanipur Education Society College
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} className="p-0" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
