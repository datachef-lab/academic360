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
  UserPlus,
  FileText,
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
import { fetchStudentSubjectSelections } from "@/services/subject-selection";
// import { useAuth } from "@/hooks/use-auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isNestedIframe = window.self !== window.top;
  const pathname = usePathname();
  //   const { user } = useAuth();
  const { accessControl, student } = useStudent();
  //   const [isSubjectSelectionCompleted, setIsSubjectSelectionCompleted] = React.useState<boolean>(false);
  console.log("pathname:", pathname);

  // Check if student's program course is MA or MCOM (hide admission registration for these)
  const isBlockedProgram = React.useMemo(() => {
    if (!student?.programCourse?.name) return false;

    const rawName = student.programCourse.name;
    const normalizedName = rawName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();

    const blockedPrograms = ["MA", "MCOM"];
    return blockedPrograms.some((program) => normalizedName.startsWith(program));
  }, [student?.programCourse?.course?.name]);

  //   React.useEffect(() => {
  //     (async () => {
  //       try {
  //         if (!student?.id) return;
  //         const data = await fetchStudentSubjectSelections(Number(student.id)).catch(() => null as any);
  //         const completed = !!(
  //           data?.hasFormSubmissions ||
  //           (Array.isArray(data?.actualStudentSelections) && data.actualStudentSelections.length > 0)
  //         );
  //         setIsSubjectSelectionCompleted(completed);
  //       } catch {
  //         setIsSubjectSelectionCompleted(false);
  //       }
  //     })();
  //   }, [student?.id]);

  // Define navigation items
  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: House,
      isActive: pathname === "/dashboard",
    },
    // {
    //   title: "Attendance",
    //   url: "/dashboard/attendance",
    //   icon: ListChecks,
    //   isActive: pathname === "/dashboard/attendance",
    // },
    {
      title: "Subject Selection",
      url: "/dashboard/subject-selection",
      icon: BookOpen,
      isActive: pathname === "/dashboard/subject-selection",
    },
    // Hide admission registration for MA and MCOM students
    ...(isBlockedProgram || !isNestedIframe
      ? []
      : [
          {
            title: "Admission & Reg. Data",
            url: "/dashboard/admission-registration",
            icon: FileText,
            isActive: pathname === "/dashboard/admission-registration",
          },
        ]),
    // {
    //   title: "Exams",
    //   url: "/dashboard/exams",
    //   icon: NotebookPen,
    //   isActive: pathname === "/dashboard/exams",
    // },
    // {
    //   title: "Course Catalogue",
    //   url: "/dashboard/course-catalogue",
    //   icon: BookOpen,
    //   isActive: pathname === "/dashboard/course-catalogue",
    // },
    // {
    //   title: "Documents",
    //   url: "/dashboard/documents",
    //   icon: ScrollText,
    //   isActive: pathname === "/dashboard/documents",
    // },
    // {
    //   title: "Enrollment & Fees",
    //   url: "/dashboard/enrollment-fees",
    //   icon: IndianRupee,
    //   isActive: pathname === "/dashboard/enrollment-fees",
    // },
    // {
    //   title: "Library",
    //   url: "/dashboard/library",
    //   icon: Library,
    //   isActive: pathname === "/dashboard/library",
    // },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: Settings2,
      isActive: pathname === "/dashboard/profile",
    },
  ].filter((ele) => !!ele);

  return (
    <Sidebar variant="floating" collapsible="icon" {...props} className="rounded-md">
      <SidebarHeader className="!bg-purple-600">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  width={32}
                  height={32}
                  src={`https://besc.academic360.app/student-console/logo.jpeg`}
                  alt={"BESC Logo"}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </div>
              <div className="grid flex-1 text-left text-sm">
                <span className="truncate font-semibold text-wrap text-white">BESC | Student Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="!bg-purple-600">
        <NavMain items={navMainItems} className="p-0" />
      </SidebarContent>
      <SidebarFooter className="!bg-purple-600 p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
