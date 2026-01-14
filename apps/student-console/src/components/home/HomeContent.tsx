"use client";

import React, { useEffect, useState, useRef } from "react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import WelcomeBanner from "./WelcomeBanner";
import BasicInfo from "./BasicInfo";
import SemesterSummary from "./SemesterSummary";
import ErrorCard from "./ErrorCard";
import StudentMissingCard from "./StudentMissingCard";
import DailyNotices from "./DailyNotices";
import SubjectSelectionCard from "./SubjectSelectionCard";
import ExamWidget from "./ExamWidget";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import type { StudentDto } from "@repo/db/dtos/user";
import { ExamDto } from "@/dtos";
import { fetchExamsByStudentId } from "@/services/exam-api.service";
import { toast } from "sonner";

export default function HomeContent() {
  const { student, loading, batches, error, refetch } = useStudent();
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const socketRef = useRef<any | null>(null);

  console.log("🏠 HomeContent render:", {
    loading,
    hasStudent: !!student,
    hasUser: !!user,
    error,
  });

  // Function to fetch and filter exams
  const fetchAndFilterExams = React.useCallback(() => {
    if (!student?.id) {
      setExams([]);
      return;
    }

    setExamsLoading(true);
    fetchExamsByStudentId(student.id)
      .then((data) => {
        const now = new Date();
        const nowTime = now.getTime();
        // Filter exams: Widget should NOT display if:
        // 1. Admit card start date is not there
        // 2. Admit card start date > current time
        // 3. Admit card end date < current time (if exists)
        const filteredExams = (data.payload.content || []).filter((exam) => {
          // 1. If no admit card start date, don't show
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

          // Don't show in widget if exam start date and last end time have both passed
          // This means the exam is fully completed
          if (firstStartTime <= nowTime && lastEndTime <= nowTime) {
            return false; // Exam is completed
          }

          // Show if all conditions are met
          return true;
        });
        setExams(filteredExams);
      })
      .catch((err) => {
        console.error("Error fetching exams for widget:", err);
        setExams([]);
      })
      .finally(() => {
        setExamsLoading(false);
      });
  }, [student?.id]);

  // Fetch exams for the widget
  useEffect(() => {
    fetchAndFilterExams();
  }, [fetchAndFilterExams]);

  // Setup socket connection to update widget on exam changes
  useEffect(() => {
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
          console.error("[HomeContent] Invalid API URL:", apiUrl, urlError);
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

        // Listen for exam updates and refresh widget
        socket.on("exam_created", () => {
          console.log("[HomeContent] Exam created, refreshing widget...");
          fetchAndFilterExams();
        });

        socket.on("exam_updated", () => {
          console.log("[HomeContent] Exam updated, refreshing widget...");
          fetchAndFilterExams();
        });

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.error("[HomeContent] Failed to load socket.io-client:", err);
      }
    };

    loadSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [student?.id, fetchAndFilterExams]);

  // Show loading while auth is still checking
  if (loading) {
    return (
      <LoadingIndicator
        message="Loading your dashboard..."
        subMessage="Please wait while we retrieve your latest information"
      />
    );
  }

  // Error handling for API errors (but not "No student profile found")
  if (error && error !== "No student profile found") {
    return <ErrorCard error={error} refetch={refetch} />;
  }

  // If no user after auth is complete, show missing card
  if (!user) {
    return <StudentMissingCard refetch={refetch} />;
  }

  // If user exists but no student data, show welcome message
  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome, {(user.name as string) || "Student"}!</h2>
          <p className="text-gray-600 mb-4">Your student profile is being set up.</p>
          <button onClick={refetch} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Show the main dashboard content
  return (
    <div className="space-y-8 min-h-screen">
      <WelcomeBanner student={student} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicInfo student={student} />
        <SubjectSelectionCard />
        {exams.length > 0 && <ExamWidget exams={exams} />}
      </div>
    </div>
  );
}
