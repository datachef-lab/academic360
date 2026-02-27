"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, FileText, BarChart, GraduationCap, History, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// Work around strict shadcn typings with proper type extensions
const TabsFixed = Tabs as React.ComponentType<
  React.ComponentProps<typeof Tabs> & { children?: React.ReactNode; className?: string; defaultValue?: string }
>;
const TabsListFixed = TabsList as React.ComponentType<
  React.ComponentProps<typeof TabsList> & { children?: React.ReactNode; className?: string }
>;
const TabsTriggerFixed = TabsTrigger as React.ComponentType<
  React.ComponentProps<typeof TabsTrigger> & { children?: React.ReactNode; value?: string; className?: string }
>;
const TabsContentFixed = TabsContent as React.ComponentType<
  React.ComponentProps<typeof TabsContent> & { children?: React.ReactNode; value?: string; className?: string }
>;
import { useStudent } from "@/providers/student-provider";
import { format, parseISO } from "date-fns";
import { ExamDto } from "@/dtos";
import { fetchExamsByStudentId } from "@/services/exam-api.service";
import { ExamPapersModal } from "./exam-papers-modal";
import { useAuth } from "@/hooks/use-auth";

export default function ExamsContent() {
  const { student } = useStudent();
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<ExamDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const socketRef = useRef<any | null>(null);

  // Derived exam lists with improved categorization
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const now = new Date(); // Current time for time-based checks

  // Helper function to check if exam has any upcoming papers
  const hasUpcomingPapers = (exam: ExamDto): boolean => {
    if (!exam.examSubjects || exam.examSubjects.length === 0) return false;
    return exam.examSubjects.some((subject) => {
      const examDate = new Date(subject.startTime);
      examDate.setHours(0, 0, 0, 0);
      return examDate > today;
    });
  };

  // Helper function to check if exam has any papers today
  const hasPapersToday = (exam: ExamDto): boolean => {
    if (!exam.examSubjects || exam.examSubjects.length === 0) return false;
    return exam.examSubjects.some((subject) => {
      const examDate = new Date(subject.startTime);
      examDate.setHours(0, 0, 0, 0);
      return examDate.getTime() === today.getTime();
    });
  };

  // Helper function to check if all papers are completed
  const allPapersCompleted = (exam: ExamDto): boolean => {
    if (!exam.examSubjects || exam.examSubjects.length === 0) return false;
    // Find the last paper (latest end time)
    const lastPaper = exam.examSubjects.reduce((latest, current) => {
      const currentEnd = new Date(current.endTime);
      const latestEnd = new Date(latest.endTime);
      return currentEnd > latestEnd ? current : latest;
    });
    const lastPaperEnd = new Date(lastPaper.endTime);
    return now > lastPaperEnd;
  };

  // Upcoming exams: Has at least one paper in the future
  const upcomingExams = exams
    .filter((exam) => hasUpcomingPapers(exam))
    .sort((a, b) => {
      // Sort by earliest upcoming paper
      const nextPaperA = a.examSubjects
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d > today;
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      const nextPaperB = b.examSubjects
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d > today;
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];

      if (!nextPaperA || !nextPaperB) return 0;
      return new Date(nextPaperA.startTime).getTime() - new Date(nextPaperB.startTime).getTime();
    });

  // Today's exams: Has at least one paper today (not yet completed)
  const recentExams = exams
    .filter((exam) => {
      if (!hasPapersToday(exam)) return false;
      // Only show if not all papers are completed
      return !allPapersCompleted(exam);
    })
    .sort((a, b) => {
      // Sort by earliest paper today
      const todayPaperA = a.examSubjects
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      const todayPaperB = b.examSubjects
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];

      if (!todayPaperA || !todayPaperB) return 0;
      return new Date(todayPaperA.startTime).getTime() - new Date(todayPaperB.startTime).getTime();
    });

  // Completed exams: All papers have been completed
  const previousExams = exams
    .filter((exam) => {
      // Only completed if ALL papers are done AND no upcoming/today papers
      return allPapersCompleted(exam) && !hasUpcomingPapers(exam) && !hasPapersToday(exam);
    })
    .sort((a, b) => {
      // Sort by latest end time (most recent first)
      const lastPaperA = a.examSubjects.reduce((latest, current) => {
        const currentEnd = new Date(current.endTime);
        const latestEnd = new Date(latest.endTime);
        return currentEnd > latestEnd ? current : latest;
      });
      const lastPaperB = b.examSubjects.reduce((latest, current) => {
        const currentEnd = new Date(current.endTime);
        const latestEnd = new Date(latest.endTime);
        return currentEnd > latestEnd ? current : latest;
      });
      return new Date(lastPaperB.endTime).getTime() - new Date(lastPaperA.endTime).getTime();
    });

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchExamsByStudentId(student.id)
      .then((data) => {
        console.log("Fetched exams via service:", data, data.payload.content);
        // Filter exams: show if admitCardStartDownloadDate exists and is less than or equal to current time
        // Show all exams (including completed) as long as admit card start date has passed
        const now = new Date();
        const nowTime = now.getTime();
        const filteredExams = (data.payload.content || []).filter((exam) => {
          // If no admit card start date is set, don't show the exam
          if (!exam.admitCardStartDownloadDate) {
            return false;
          }
          const startDate = new Date(exam.admitCardStartDownloadDate);
          const startTime = startDate.getTime();

          // Show if start date time is less than or equal to current time
          // This includes both active and completed exams
          return startTime <= nowTime;
        });
        setExams(filteredExams);
      })
      .catch((err) => {
        console.error("Error fetching exams via service:", err);
        setError(err instanceof Error ? err.message : "Failed to load exams");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [student?.id]);

  // Setup socket connection for real-time exam updates
  useEffect(() => {
    if (!student?.id || typeof window === "undefined") return;

    // Prevent multiple socket connections
    if (socketRef.current?.connected) {
      console.log("[Student Console] Socket already connected, skipping...");
      return;
    }

    // Dynamic import to avoid SSR issues - load socket.io-client only on client side
    const loadSocket = async () => {
      try {
        // @ts-ignore - socket.io-client will be available after pnpm install
        const socketModule = await import("socket.io-client");
        // Use the same backend URL as API calls from NEXT_PUBLIC_API_URL
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Wrap URL parsing in try-catch for better error handling
        let parsed: URL;
        try {
          parsed = new URL(apiUrl);
        } catch (urlError) {
          console.error("[Student Console] Invalid API URL:", apiUrl, urlError);
          return;
        }

        // Use the exact same origin as the API URL (backend socket runs on the same server)
        const origin = `${parsed.protocol}//${parsed.host}`;
        const pathPrefix = parsed.pathname.replace(/\/$/, "");
        const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

        console.log("[Student Console] Connecting socket to:", origin, "path:", socketPath);

        // @ts-ignore - socket.io-client types will be available after pnpm install
        const socket: any = socketModule.io(origin, {
          path: socketPath,
          withCredentials: true,
          transports: ["polling", "websocket"], // Try polling first, then websocket
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
        } as any);

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("[Student Console] Socket connected:", socket.id);
          // Authenticate with USER id (so backend can classify STUDENT correctly)
          if (user?.id) {
            socket.emit("authenticate", user.id.toString());
          }
        });

        socket.on("disconnect", () => {
          console.log("[Student Console] Socket disconnected");
        });

        socket.on("connect_error", (err: Error) => {
          console.error("[Student Console] Socket connection error:", err);
        });

        // Listen for exam updates
        socket.on("exam_updated", (data: { examId: number; type: string; message: string }) => {
          console.log("[Student Console] Exam updated:", data);
          toast.info("An exam has been updated. Refreshing...", {
            duration: 3000,
          });
          // Refetch exams
          if (student?.id) {
            fetchExamsByStudentId(student.id)
              .then((data) => {
                const now = new Date();
                const filteredExams = (data.payload.content || []).filter((exam) => {
                  if (!exam.admitCardStartDownloadDate) {
                    return false;
                  }
                  const startDate = new Date(exam.admitCardStartDownloadDate);
                  return startDate <= now;
                });
                setExams(filteredExams);
              })
              .catch((err: Error) => {
                console.error("Error refetching exams:", err);
              });
          }
        });

        socket.on("exam_created", (data: { examId: number; type: string; message: string }) => {
          console.log("[Student Console] Exam created:", data);
          toast.info("A new exam has been scheduled. Refreshing...", {
            duration: 3000,
          });
          // Refetch exams
          if (student?.id) {
            fetchExamsByStudentId(student.id)
              .then((data) => {
                const now = new Date();
                const filteredExams = (data.payload.content || []).filter((exam) => {
                  if (!exam.admitCardStartDownloadDate) {
                    return false;
                  }
                  const startDate = new Date(exam.admitCardStartDownloadDate);
                  return startDate <= now;
                });
                setExams(filteredExams);
              })
              .catch((err: Error) => {
                console.error("Error refetching exams:", err);
              });
          }
        });
      } catch (err) {
        console.error("[Student Console] Failed to load socket.io-client:", err);
      }
    };

    loadSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [student?.id]);

  //   useEffect(() => {
  //     // If we don't have a student ID yet, do nothing
  //     if (!student?.id || !accessToken) return;

  //     // Prevent multiple simultaneous fetches
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }

  //     // Only show loading on initial fetch, not during refetches
  //     if (!hasInitialFetchRef.current) {
  //       setLoading(true);
  //     }

  //     // Create a new abort controller for this request
  //     const controller = new AbortController();
  //     abortControllerRef.current = controller;

  //     const fetchExams = async () => {
  //       try {
  //         setError(null);

  //         // Check if this request has been aborted
  //         if (controller.signal.aborted) return;

  //         const response = await fetch(`/api/exams?studentId=${student.id}`, {
  //           headers: {
  //             Authorization: `Bearer ${accessToken}`,
  //           },
  //           signal: controller.signal,
  //         });

  //         // Check if this request has been aborted after fetch
  //         if (controller.signal.aborted) return;

  //         if (!response.ok) {
  //           throw new Error(`Failed to fetch exams: ${response.statusText}`);
  //         }

  //         const data = await response.json();
  //         setAllExams(data || []);
  //         hasInitialFetchRef.current = true;
  //       } catch (err) {
  //         // Don't set error state if this was an abort error
  //         if (err instanceof DOMException && err.name === "AbortError") return;

  //         console.error("Error fetching exams:", err);
  //         setError(err instanceof Error ? err.message : "Failed to load exams");
  //       } finally {
  //         // Only update loading state if this request wasn't aborted
  //         if (!controller.signal.aborted) {
  //           setLoading(false);
  //         }
  //       }
  //     };

  //     fetchExams();

  //     // Cleanup: abort any in-flight requests when the component unmounts
  //     return () => {
  //       if (abortControllerRef.current) {
  //         abortControllerRef.current.abort();
  //       }
  //     };
  //   }, [student, accessToken]);

  const getNextExamDaysAway = () => {
    if (upcomingExams.length === 0) return "N/A";

    // Find the next upcoming paper across all upcoming exams
    let nextPaper = null;
    for (const exam of upcomingExams) {
      if (!exam.examSubjects || exam.examSubjects.length === 0) continue;
      const upcomingPapers = exam.examSubjects
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d > today;
        })
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      if (upcomingPapers.length > 0) {
        if (!nextPaper || new Date(upcomingPapers[0].startTime) < new Date(nextPaper.startTime)) {
          nextPaper = upcomingPapers[0];
        }
      }
    }

    if (!nextPaper) return "N/A";

    const nextExamDate = new Date(nextPaper.startTime);
    const todayCopy = new Date();

    // Normalize both to midnight for day-based diff
    nextExamDate.setHours(0, 0, 0, 0);
    todayCopy.setHours(0, 0, 0, 0);

    const diffTime = nextExamDate.getTime() - todayCopy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    return `${diffDays} days`;
  };

  // Calculate total exam duration for today in minutes
  const getTotalTodayExamDuration = () => {
    if (recentExams.length === 0) return 0;

    return recentExams.reduce((total, exam) => {
      // Sum duration for all papers today in this exam
      const todayPapers = exam.examSubjects.filter((s) => {
        const d = new Date(s.startTime);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      const examDuration = todayPapers.reduce((examTotal, subject) => {
        const start = new Date(subject.startTime);
        const end = new Date(subject.endTime);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        // Safety guard
        if (durationMinutes <= 0 || durationMinutes > 480 || isNaN(durationMinutes)) {
          return examTotal + 120; // fallback 2 hours
        }

        return examTotal + durationMinutes;
      }, 0);

      return total + examDuration;
    }, 0);
  };

  // Format minutes into hours and minutes string
  const formatMinutesToHoursMinutes = (totalMinutes: number) => {
    if (totalMinutes <= 0) return "N/A";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min`;
  };

  // Create a simplified Exam Card component for consistent styling
  const ExamCard = ({
    exam,
    index,
    variant = "default",
    onViewDetails,
  }: {
    exam: ExamDto;
    index: number;
    variant?: "default" | "today" | "completed";
    onViewDetails: (exam: ExamDto) => void;
  }) => {
    const variantStyles = {
      default: {
        border: "border-indigo-100",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        titleColor: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-100",
      },
      today: {
        border: "border-emerald-100",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        titleColor: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
      completed: {
        border: "border-gray-200",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        titleColor: "text-gray-600",
        badge: "bg-gray-100 text-gray-700 border-gray-200",
      },
    };

    const styles = variantStyles[variant];

    // Icon based on variant
    const Icon = variant === "completed" ? FileText : variant === "today" ? GraduationCap : Calendar;

    // Determine which paper to display based on variant
    const getRelevantPaper = () => {
      if (!exam.examSubjects || exam.examSubjects.length === 0) return null;

      if (variant === "default") {
        // Show next upcoming paper
        const upcomingPapers = exam.examSubjects
          .filter((s) => {
            const d = new Date(s.startTime);
            d.setHours(0, 0, 0, 0);
            return d > today;
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return upcomingPapers[0] || exam.examSubjects[0];
      } else if (variant === "today") {
        // Show today's paper (earliest if multiple)
        const todayPapers = exam.examSubjects
          .filter((s) => {
            const d = new Date(s.startTime);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return todayPapers[0] || exam.examSubjects[0];
      } else {
        // Completed: Show last paper
        return exam.examSubjects.reduce((latest, current) => {
          const currentEnd = new Date(current.endTime);
          const latestEnd = new Date(latest.endTime);
          return currentEnd > latestEnd ? current : latest;
        });
      }
    };

    const displayPaper = getRelevantPaper();

    return (
      <motion.div
        key={exam.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className={`shadow-md hover:shadow-lg transition-all overflow-hidden group ${styles.border}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4 w-full md:w-auto">
                <div className={`${styles.iconBg} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{exam.examType?.name || "Exam"}</h3>
                  {/* {displayPaper?.subject?.name && (
                    <p className={`${styles.titleColor} font-medium mb-2`}>{displayPaper.subject.name}</p>
                  )} */}
                  {displayPaper && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        {format(new Date(displayPaper.startTime), "dd/MM/yyyy")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                        {format(new Date(displayPaper.startTime), "hh:mm a")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 md:mt-0 flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${styles.badge}`}>
                  {exam.class.name}
                </span>
                <button
                  onClick={() => onViewDetails(exam)}
                  className={`p-2 rounded-lg transition-all ${styles.iconBg} hover:opacity-80 ${styles.iconColor} cursor-pointer`}
                  title="View exam papers"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-10 px-6 mb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
          <div className="absolute inset-0 bg-[url('/illustrations/dots-pattern.svg')] opacity-5"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-5 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
                <GraduationCap size={36} className="text-white drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">Exams Dashboard</h1>
                <p className="text-blue-50 text-lg drop-shadow max-w-2xl">
                  Track your examinations and academic performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Upcoming Exams</p>
                    <p className="text-3xl font-bold text-blue-700">{upcomingExams.length}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Next Exam</p>
                    <p className="text-3xl font-bold text-amber-700">{getNextExamDaysAway()}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <Clock size={24} className="text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Subjects</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {
                        [
                          ...new Set(
                            exams.flatMap((exam) => exam.examSubjects.map((es) => es.subject?.name).filter(Boolean)),
                          ),
                        ].length
                      }
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <FileText size={24} className="text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Today&apos;s Exams</p>
                    <p className="text-3xl font-bold text-emerald-700">{recentExams.length}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <BarChart size={24} className="text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Exams Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 relative"
        >
          {loading ? (
            <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col justify-center items-center z-10">
              <div className="w-14 h-14 relative mb-3">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-t-2 border-indigo-500/30 animate-pulse"></div>
              </div>
              <p className="text-indigo-600 font-medium">Loading exams...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Error Loading Exams</h3>
              <p className="text-gray-500 max-w-md mx-auto">{error}</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Exams Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn&apos;t find any exams for your account. If you believe this is an error, please contact the
                administrative staff.
              </p>
            </div>
          ) : (
            <TabsFixed defaultValue="recent" className="w-full">
              <TabsListFixed className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-50/60 p-1 mb-8">
                <TabsTriggerFixed
                  value="upcoming"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Upcoming ({upcomingExams.length})
                </TabsTriggerFixed>
                <TabsTriggerFixed
                  value="recent"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Today ({recentExams.length})
                </TabsTriggerFixed>
                <TabsTriggerFixed
                  value="previous"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <History className="w-4 h-4 mr-2" />
                  Completed ({previousExams.length})
                </TabsTriggerFixed>
              </TabsListFixed>

              <TabsContentFixed value="upcoming" className="space-y-4">
                {upcomingExams.length === 0 ? (
                  <div className="text-center py-8 bg-blue-50/50 rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Upcoming Exams</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don&apos;t have any upcoming exams scheduled at the moment.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Reminder note */}
                    <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Important Notice</h3>
                        <p className="text-blue-700">Please arrive 15 minutes prior to the start time of all exams.</p>
                      </div>
                    </div>
                    {upcomingExams
                      .filter((exam) => selectedSemester === "all" || exam.class.name === selectedSemester)
                      .map((exam, index) => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          index={index}
                          variant="default"
                          onViewDetails={(exam) => {
                            setSelectedExam(exam);
                            setIsModalOpen(true);
                          }}
                        />
                      ))}
                  </>
                )}
              </TabsContentFixed>

              <TabsContentFixed value="recent" className="space-y-4">
                {recentExams.length === 0 ? (
                  <div className="text-center py-8 bg-emerald-50/50 rounded-lg">
                    <Clock className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Exams Today</h3>
                    <p className="text-gray-500 max-w-md mx-auto">You don&apos;t have any exams scheduled for today.</p>
                  </div>
                ) : (
                  <>
                    {/* Reminder note */}
                    <div className="mb-4 bg-amber-50 rounded-lg p-4 border border-amber-100 flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-amber-800">Today&apos;s Reminder</h3>
                        <p className="text-amber-700">Please arrive 15 minutes prior to the start time of all exams.</p>
                      </div>
                    </div>

                    {/* Today's exams summary */}
                    <div className="mb-6 bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Clock className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-emerald-800">Total Exam Time Today</h3>
                            <p className="text-lg font-bold text-emerald-600">
                              {formatMinutesToHoursMinutes(getTotalTodayExamDuration())}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {recentExams.length} exam
                            {recentExams.length !== 1 ? "s" : ""} today
                          </span>
                        </div>
                      </div>
                    </div>
                    {recentExams
                      .filter((exam) => selectedSemester === "all" || exam.class.name === selectedSemester)
                      .map((exam, index) => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          index={index}
                          variant="today"
                          onViewDetails={(exam) => {
                            setSelectedExam(exam);
                            setIsModalOpen(true);
                          }}
                        />
                      ))}
                  </>
                )}
              </TabsContentFixed>

              <TabsContentFixed value="previous" className="space-y-4">
                {previousExams.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Completed Exams</h3>
                    <p className="text-gray-500 max-w-md mx-auto">You don&apos;t have any completed exam records.</p>
                  </div>
                ) : (
                  previousExams
                    .filter((exam) => selectedSemester === "all" || exam.class.name === selectedSemester)
                    .map((exam, index) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        index={index}
                        variant="completed"
                        onViewDetails={(exam) => {
                          setSelectedExam(exam);
                          setIsModalOpen(true);
                        }}
                      />
                    ))
                )}
              </TabsContentFixed>
            </TabsFixed>
          )}
        </motion.div>
      </div>

      {/* Exam Papers Modal */}
      {student?.id && (
        <ExamPapersModal open={isModalOpen} onOpenChange={setIsModalOpen} exam={selectedExam} studentId={student.id} />
      )}
    </div>
  );
}
