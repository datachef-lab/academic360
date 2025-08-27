"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  FileText,
  BarChart,
  GraduationCap,
  History,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useStudent } from "@/providers/student-provider";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
interface Exam {
  id: number;
  testid: number;
  testName: string;
  classid: number;
  className: string;
  sessid: number;
  sessionName: string;
  examdate: string;
  frmhr: number;
  frmmnt: number;
  tohr: number;
  tomnt: number;
  room: string;
  entrydate: string;
  subjectTypeName: string;
  paperid: number;
  paperName: string;
}

export default function ExamsContent() {
  const { accessToken } = useAuth();
  const { student, accessControl } = useStudent();
  const router = useRouter();
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const hasInitialFetchRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    if (!accessControl?.access_course) {
      router.back();
    }
  }, [accessControl, router]);

  // Derived exam lists with improved categorization
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Upcoming exams: future dates (starting from tomorrow)
  const upcomingExams = allExams
    .filter((exam) => {
      const examDate = parseISO(exam.examdate);
      examDate.setHours(0, 0, 0, 0);
      return examDate > today;
    })
    .sort(
      (a, b) => parseISO(a.examdate).getTime() - parseISO(b.examdate).getTime()
    );

  // Today's exams: exams happening today
  const recentExams = allExams
    .filter((exam) => {
      const examDate = parseISO(exam.examdate);
      examDate.setHours(0, 0, 0, 0);
      return examDate.getTime() === today.getTime();
    })
    .sort((a, b) => a.frmhr * 60 + a.frmmnt - (b.frmhr * 60 + b.frmmnt));

  // Completed exams: exams from before today or completed today based on time
  const previousExams = allExams
    .filter((exam) => {
      const examDate = parseISO(exam.examdate);
      examDate.setHours(0, 0, 0, 0);

      // If exam date is before today, it's definitely in the past
      if (examDate < today) return true;

      // If exam is today, check if it's completed based on end time
      if (examDate.getTime() === today.getTime()) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const examEndTimeInMinutes = exam.tohr * 60 + exam.tomnt;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // If current time is past the exam end time, it's completed
        return currentTimeInMinutes > examEndTimeInMinutes;
      }

      return false;
    })
    .sort(
      (a, b) => parseISO(b.examdate).getTime() - parseISO(a.examdate).getTime()
    );

  useEffect(() => {
    // If we don't have a student ID yet, do nothing
    if (!student?.id || !accessToken) return;

    // Prevent multiple simultaneous fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Only show loading on initial fetch, not during refetches
    if (!hasInitialFetchRef.current) {
      setLoading(true);
    }

    // Create a new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchExams = async () => {
      try {
        setError(null);

        // Check if this request has been aborted
        if (controller.signal.aborted) return;

        const response = await fetch(`/api/exams?studentId=${student.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        // Check if this request has been aborted after fetch
        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(`Failed to fetch exams: ${response.statusText}`);
        }

        const data = await response.json();
        setAllExams(data || []);
        hasInitialFetchRef.current = true;
      } catch (err) {
        // Don't set error state if this was an abort error
        if (err instanceof DOMException && err.name === "AbortError") return;

        console.error("Error fetching exams:", err);
        setError(err instanceof Error ? err.message : "Failed to load exams");
      } finally {
        // Only update loading state if this request wasn't aborted
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchExams();

    // Cleanup: abort any in-flight requests when the component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [student, accessToken]);

  // Get all available semesters from the exams (placeholder logic - adjust as needed)
  const semesters = [...new Set(allExams.map((exam) => exam.sessionName))];

  // Get next exam date in days
  const getNextExamDaysAway = () => {
    if (upcomingExams.length === 0) return "N/A";

    const nextExamDate = parseISO(upcomingExams[0].examdate);
    const today = new Date();
    const diffTime = Math.abs(nextExamDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 0 ? "Today" : `${diffDays} days`;
  };

  // Format time from hours and minutes
  const formatTime = (hours: number, minutes: number) => {
    const formattedHours = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  // Format duration from start and end times with a max limit to prevent unreasonable durations
  const formatDuration = (
    startHr: number,
    startMin: number,
    endHr: number | Date,
    endMin: number | Date
  ) => {
    const startMinutes = startHr * 60 + startMin;

    // Handle the case where endHr/endMin might be Date objects or numbers
    let endHourVal: number;
    let endMinVal: number;

    if (typeof endHr === "object" && endHr !== null) {
      // If it's a Date object
      endHourVal = (endHr as Date).getHours();
    } else {
      // If it's a number or string
      endHourVal = Number(endHr);
    }

    if (typeof endMin === "object" && endMin !== null) {
      // If it's a Date object
      endMinVal = (endMin as Date).getMinutes();
    } else {
      // If it's a number or string
      endMinVal = Number(endMin);
    }

    const endMinutes = endHourVal * 60 + endMinVal;
    const durationMinutes = endMinutes - startMinutes;

    // If duration is negative or unreasonably large (>8 hours), show a reasonable default
    if (
      durationMinutes <= 0 ||
      durationMinutes > 480 ||
      isNaN(durationMinutes)
    ) {
      // Try to provide a sensible default based on the exam type (2 hours for most exams)
      return "2 hours";
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min`;
  };

  // Calculate total exam duration for today in minutes
  const getTotalTodayExamDuration = () => {
    if (recentExams.length === 0) return 0;

    return recentExams.reduce((total, exam) => {
      const startMinutes = exam.frmhr * 60 + exam.frmmnt;

      // Handle the case where tohr/tomnt might be Date objects or numbers
      let endHourVal: number;
      let endMinVal: number;

      if (typeof exam.tohr === "object" && exam.tohr !== null) {
        // If it's a Date object
        endHourVal = (exam.tohr as Date).getHours();
      } else {
        // If it's a number or string
        endHourVal = Number(exam.tohr);
      }

      if (typeof exam.tomnt === "object" && exam.tomnt !== null) {
        // If it's a Date object
        endMinVal = (exam.tomnt as Date).getMinutes();
      } else {
        // If it's a number or string
        endMinVal = Number(exam.tomnt);
      }

      const endMinutes = endHourVal * 60 + endMinVal;
      const duration = endMinutes - startMinutes;

      // If duration is invalid, use a default of 2 hours (120 minutes)
      if (duration <= 0 || duration > 480 || isNaN(duration)) {
        return total + 120; // Default 2 hours per exam
      }

      return total + duration;
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
  }: {
    exam: Exam;
    index: number;
    variant?: "default" | "today" | "completed";
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
    const Icon =
      variant === "completed"
        ? FileText
        : variant === "today"
        ? GraduationCap
        : Calendar;

    return (
      <motion.div
        key={exam.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          className={`shadow-md hover:shadow-lg transition-all overflow-hidden group ${styles.border}`}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4 w-full md:w-auto">
                <div
                  className={`${styles.iconBg} p-3 rounded-lg flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {exam.testName}
                  </h3>
                  <p className={`${styles.titleColor} font-medium mb-2`}>
                    {exam.paperName}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                      {format(parseISO(exam.examdate), "MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                      {formatTime(exam.frmhr, exam.frmmnt)}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
                      {formatDuration(
                        exam.frmhr,
                        exam.frmmnt,
                        exam.tohr,
                        exam.tomnt
                      )}
                    </div>
                    <div className="flex items-center">
                      <BarChart className="w-4 h-4 mr-1.5 text-gray-400" />
                      {exam.room}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 md:mt-0">
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${styles.badge}`}
                >
                  {exam.className}
                </span>
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
                <GraduationCap
                  size={36}
                  className="text-white drop-shadow-md"
                />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                  Exams Dashboard
                </h1>
                <p className="text-blue-50 text-lg drop-shadow max-w-2xl">
                  Track your examinations and academic performance
                </p>
              </div>
            </div>
            {semesters.length > 0 && (
              <div className="hidden md:block">
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white backdrop-blur-sm">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {semesters.length > 0 && (
          <div className="block md:hidden mb-6">
            <Select
              value={selectedSemester}
              onValueChange={setSelectedSemester}
            >
              <SelectTrigger className="w-full border-indigo-100">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
                    <p className="text-sm text-blue-600 font-medium">
                      Upcoming Exams
                    </p>
                    <p className="text-3xl font-bold text-blue-700">
                      {upcomingExams.length}
                    </p>
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
                    <p className="text-sm text-amber-600 font-medium">
                      Next Exam
                    </p>
                    <p className="text-3xl font-bold text-amber-700">
                      {getNextExamDaysAway()}
                    </p>
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
                    <p className="text-sm text-purple-600 font-medium">
                      Total Subjects
                    </p>
                    <p className="text-3xl font-bold text-purple-700">
                      {
                        [...new Set(allExams.map((exam) => exam.paperName))]
                          .length
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
                    <p className="text-sm text-emerald-600 font-medium">
                      Today&apos;s Exams
                    </p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {recentExams.length}
                    </p>
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
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Error Loading Exams
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">{error}</p>
            </div>
          ) : allExams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Exams Found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn&apos;t find any exams for your account. If you believe
                this is an error, please contact the administrative staff.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-50/60 p-1 mb-8">
                <TabsTrigger
                  value="upcoming"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Upcoming ({upcomingExams.length})
                </TabsTrigger>
                <TabsTrigger
                  value="recent"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Today ({recentExams.length})
                </TabsTrigger>
                <TabsTrigger
                  value="previous"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                >
                  <History className="w-4 h-4 mr-2" />
                  Completed ({previousExams.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingExams.length === 0 ? (
                  <div className="text-center py-8 bg-blue-50/50 rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Upcoming Exams
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don&apos;t have any upcoming exams scheduled at the
                      moment.
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
                        <h3 className="text-sm font-medium text-blue-800">
                          Important Notice
                        </h3>
                        <p className="text-blue-700">
                          Please arrive 15 minutes prior to the start time of
                          all exams.
                        </p>
                      </div>
                    </div>
                    {upcomingExams
                      .filter(
                        (exam) =>
                          selectedSemester === "all" ||
                          exam.sessionName === selectedSemester
                      )
                      .map((exam, index) => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          index={index}
                          variant="default"
                        />
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {recentExams.length === 0 ? (
                  <div className="text-center py-8 bg-emerald-50/50 rounded-lg">
                    <Clock className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Exams Today
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don&apos;t have any exams scheduled for today.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Reminder note */}
                    <div className="mb-4 bg-amber-50 rounded-lg p-4 border border-amber-100 flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-amber-800">
                          Today&apos;s Reminder
                        </h3>
                        <p className="text-amber-700">
                          Please arrive 15 minutes prior to the start time of
                          all exams.
                        </p>
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
                            <h3 className="text-sm font-medium text-emerald-800">
                              Total Exam Time Today
                            </h3>
                            <p className="text-lg font-bold text-emerald-600">
                              {formatMinutesToHoursMinutes(
                                getTotalTodayExamDuration()
                              )}
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
                      .filter(
                        (exam) =>
                          selectedSemester === "all" ||
                          exam.sessionName === selectedSemester
                      )
                      .map((exam, index) => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          index={index}
                          variant="today"
                        />
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="previous" className="space-y-4">
                {previousExams.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Completed Exams
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don&apos;t have any completed exam records.
                    </p>
                  </div>
                ) : (
                  previousExams
                    .filter(
                      (exam) =>
                        selectedSemester === "all" ||
                        exam.sessionName === selectedSemester
                    )
                    .map((exam, index) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        index={index}
                        variant="completed"
                      />
                    ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
}
