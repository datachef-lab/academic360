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
import { fetchExamsByStudentId } from "@/services/exam-api.service";
import { ExamDto } from "@/dtos";
// import { useAuth } from "@/hooks/use-auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isNestedIframe = window.self !== window.top;
  const pathname = usePathname();
  //   const { user } = useAuth();
  const { accessControl, student } = useStudent();
  const [upcomingExamCount, setUpcomingExamCount] = React.useState<number>(0);
  //   const [isSubjectSelectionCompleted, setIsSubjectSelectionCompleted] = React.useState<boolean>(false);
  console.log("pathname:", pathname);

  // Function to fetch and update exam count
  const updateExamCount = React.useCallback(() => {
    if (!student?.id) {
      setUpcomingExamCount(0);
      return;
    }

    fetchExamsByStudentId(student.id)
      .then((data) => {
        const now = new Date();
        // Filter exams: only count upcoming exams (not completed and admit card available)
        const upcomingExams = (data.payload.content || []).filter((exam) => {
          // If no admit card start date, don't count
          if (!exam.admitCardStartDownloadDate) {
            return false;
          }

          // Check if admit card download date has passed (must be less than or equal to current time)
          const startDate = new Date(exam.admitCardStartDownloadDate);
          if (startDate > now) {
            return false; // Admit card download hasn't started yet
          }

          // Check if exam has subjects
          if (!exam.examSubjects || exam.examSubjects.length === 0) {
            return false;
          }

          // Check if exam is completed (all subjects have ended)
          const allCompleted = exam.examSubjects.every((subject) => {
            const endTime = new Date(subject.endTime);
            return endTime < now;
          });

          // Only count if exam is NOT completed
          return !allCompleted;
        });
        setUpcomingExamCount(upcomingExams.length);
      })
      .catch((err) => {
        console.error("Error fetching exam count for badge:", err);
        setUpcomingExamCount(0);
      });
  }, [student?.id]);

  // Fetch upcoming exam count for badge
  React.useEffect(() => {
    updateExamCount();
  }, [updateExamCount]);

  // Setup socket connection to update badge count on exam changes
  React.useEffect(() => {
    if (!student?.id || typeof window === "undefined") return;

    // Dynamic import to avoid SSR issues
    const loadSocket = async () => {
      try {
        // @ts-ignore - socket.io-client will be available after pnpm install
        const socketModule = await import("socket.io-client");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const parsed = new URL(apiUrl);
        const origin = `${parsed.protocol}//${parsed.host}`;
        const pathPrefix = parsed.pathname.replace(/\/$/, "");
        const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

        // @ts-ignore - socket.io-client types will be available after pnpm install
        const socket: any = socketModule.io(origin, {
          path: socketPath,
          withCredentials: true,
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
        } as any);

        socket.on("connect", () => {
          if (student?.id) {
            socket.emit("authenticate", student.id.toString());
          }
        });

        // Listen for exam updates and refresh count
        socket.on("exam_created", () => {
          updateExamCount();
        });

        socket.on("exam_updated", () => {
          updateExamCount();
        });

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.error("[Sidebar] Failed to load socket.io-client:", err);
      }
    };

    loadSocket();
  }, [student?.id, updateExamCount]);

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
    {
      title: "Exams",
      url: "/dashboard/exams",
      icon: NotebookPen,
      isActive: pathname === "/dashboard/exams",
      badge: upcomingExamCount > 0 ? upcomingExamCount : undefined,
    },
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
