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
  UploadCloud,

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
import { useAuth } from "@/hooks/use-auth";
import { useCollegeSettings } from "@/hooks/use-college-settings";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isNestedIframe = window.self !== window.top;
  const pathname = usePathname();
  const { user } = useAuth();
  const { accessControl, student } = useStudent();
  const { name: collegeName, logoUrl: collegeLogoUrl, isLoading: isLoadingSettings } = useCollegeSettings();
  const [upcomingExamCount, setUpcomingExamCount] = React.useState<number>(0);
  const socketRef = React.useRef<any | null>(null);
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
        const nowTime = now.getTime();
        // Filter exams: Badge should NOT count if:
        // 1. Admit card start date is not there
        // 2. Admit card start date > current time
        // 3. Admit card end date < current time (if exists)
        const upcomingExams = (data.payload.content || []).filter((exam) => {
          // 1. If no admit card start date, don't count
          if (!exam.admitCardStartDownloadDate) {
            return false;
          }

          // 2. Check if admit card start date is greater than current time
          const startDate = new Date(exam.admitCardStartDownloadDate);
          const startTime = startDate.getTime();

          if (startTime > nowTime) {
            return false; // Admit card download hasn't started yet
          }

          // 3. Check if admit card end date exists and is less than current time
          if (exam.admitCardLastDownloadDate) {
            const endDate = new Date(exam.admitCardLastDownloadDate);
            const endTime = endDate.getTime();

            if (endTime < nowTime) {
              return false; // Admit card download period has ended
            }
          }

          // Check if exam has subjects
          if (!exam.examSubjects || exam.examSubjects.length === 0) {
            return false;
          }

          // Check if exam is completed: exam start date and last end time have passed
          const firstSubjectStart = new Date(exam.examSubjects[0].startTime);
          const lastSubjectEnd = new Date(exam.examSubjects[exam.examSubjects.length - 1].endTime);

          const firstStartTime = firstSubjectStart.getTime();
          const lastEndTime = lastSubjectEnd.getTime();

          // Don't count if exam start date and last end time have both passed
          // This means the exam is fully completed
          if (firstStartTime <= nowTime && lastEndTime <= nowTime) {
            return false; // Exam is completed
          }

          // Count if all conditions are met
          return true;
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

    // Prevent multiple socket connections
    if (socketRef.current?.connected) {
      return;
    }

    // Dynamic import to avoid SSR issues
    const loadSocket = async () => {
      try {
        // @ts-ignore - socket.io-client will be available after pnpm install
        const socketModule = await import("socket.io-client");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Wrap URL parsing in try-catch for better error handling
        let parsed: URL;
        try {
          parsed = new URL(apiUrl);
        } catch (urlError) {
          console.error("[Sidebar] Invalid API URL:", apiUrl, urlError);
          return;
        }

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

        socketRef.current = socket;

        socket.on("connect", () => {
          // Authenticate with user id (so backend can classify STUDENT correctly)
          if (user?.id) {
            socket.emit("authenticate", user.id.toString());
          }
        });

        // Listen for exam updates and refresh count
        socket.on("exam_created", () => {
          updateExamCount();
        });

        socket.on("exam_updated", () => {
          updateExamCount();
        });
      } catch (err) {
        console.error("[Sidebar] Failed to load socket.io-client:", err);
      }
    };

    loadSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
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

    {
      title: "CU Form Upload",
      url: "/dashboard/cu-form-upload",
      icon: UploadCloud,
      isActive: pathname === "/dashboard/cu-form-upload",
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
                {collegeLogoUrl ? (
                  <Image
                    width={32}
                    height={32}
                    src={collegeLogoUrl}
                    alt={collegeName}
                    className="w-8 h-8 rounded-lg object-cover"
                    unoptimized
                    onError={(e) => {
                      // Fallback if image fails to load
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-purple-400 flex items-center justify-center text-white font-bold text-sm">
                    {collegeName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm">
                <span className="truncate font-semibold text-wrap text-white">
                  {isLoadingSettings ? "Loading..." : `${collegeName} | Student Console`}
                </span>
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
