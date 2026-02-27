import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExamGroupDto, ExamPapersWithStats, ExamSubjectDto } from "@/dtos";
import {
  downloadAdmitCardTracking,
  // deleteExamById,
  // fetchExamById,
  // fetchExamPapersStatsByExamId,
  updateExamSubject,
  triggerExamAdmitCardByExamGroupId,
  fetchExamCandidatesByExamIdOrExamGroupId,
} from "@/services/exam.service";

import { IdCard, Sheet, Trash2, UsersRound, Download, Calendar, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExamPaperRow from "../components/exam-paper-row";
import { ProgressUpdate } from "@/types/progress";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ExportService } from "@/services/exportService";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { useSocket } from "@/hooks/useSocket";
import { EditExamSubjectDialog } from "../components/edit-exam-subject-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateExamAdmitCardDates } from "@/services/exam.service";
import {
  deleteExamGroupById,
  fetchExamGroupById,
  fetchExamGroupPapersStatsByExamId,
} from "@/services/exam-group.service";

export default function ExamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { examGroupId } = useParams<{ examGroupId: string }>();
  const [examGroup, setExamGroup] = useState<ExamGroupDto | null>(null);
  const [examPapersWithStats, setExamPapersWithStats] = useState<
    {
      examId: number;
      examPapers: ExamPapersWithStats[];
    }[]
  >([]);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [selectedExamSubject, setSelectedExamSubject] = useState<ExamSubjectDto | null>(null);
  const [admitCardDatesDialogOpen, setAdmitCardDatesDialogOpen] = useState(false);
  const [admitCardStartDate, setAdmitCardStartDate] = useState<string>("");
  const [admitCardEndDate, setAdmitCardEndDate] = useState<string>("");
  const [updatingDates, setUpdatingDates] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExam, setDeletingExam] = useState(false);
  const [sendAdmitCardDialogOpen, setSendAdmitCardDialogOpen] = useState(false);

  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const setIsExporting = useState(false)[1];
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);

  const userId = (user?.id ?? "").toString();

  const canDeleteExam = (() => {
    if (!examGroup?.exams[0]?.admitCardStartDownloadDate) return false;
    const startMs = new Date(examGroup.exams[0].admitCardStartDownloadDate).getTime();
    if (Number.isNaN(startMs)) return false;
    const cutoffMs = startMs - 24 * 60 * 60 * 1000;
    return Date.now() <= cutoffMs;
  })();

  // Memoize the progress update handler to prevent re-renders
  const handleProgressUpdate = useCallback((data: ProgressUpdate) => {
    console.log("Progress update received:", data);
    setCurrentProgressUpdate(data);

    // Handle completion status from socket updates
    if (data.status === "completed") {
      console.log("Export completed via socket update");
      setIsExporting(false);
      // The modal will auto-close due to the completed status in ExportProgressDialog
    } else if (data.status === "error") {
      console.log("Export failed via socket update");
      setIsExporting(false);
    }
  }, []);

  // Initialize WebSocket connection
  const { socket, isConnected } = useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  // Refetch exam data when it gets updated via socket
  const refetchExamData = useCallback(() => {
    if (examGroupId) {
      fetchExamGroupById(Number(examGroupId)).then((data) => {
        setExamGroup(data);
        // Update admit card dates
        if (data.exams[0]!.admitCardStartDownloadDate) {
          setAdmitCardStartDate(toDatetimeLocal(data.exams[0]!.admitCardStartDownloadDate));
        }
        if (data.exams[0]!.admitCardLastDownloadDate) {
          setAdmitCardEndDate(toDatetimeLocal(data.exams[0]!.admitCardLastDownloadDate));
        }
      });
      fetchExamGroupPapersStatsByExamId(Number(examGroupId)).then((data) => {
        setExamPapersWithStats(data);
      });
    }
  }, [examGroupId]);

  // Listen for exam update events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleExamUpdated = (data: { examId: number; type: string; message: string }) => {
      console.log("[Exam Page] Exam updated event received:", data);
      // Only refetch if it's this exam
      if (examGroupId) {
        toast.info("Exam has been updated. Refreshing...", {
          duration: 2000,
        });
        refetchExamData();
      }
    };

    const handleExamGroupDeleted = (data: { examId: number; type: string; message: string }) => {
      console.log("[Exam Page] Exam group deleted event received:", data);
      // If this exam was deleted, navigate back to exams list
      if (examGroupId) {
        toast.error("This exam has been deleted", {
          duration: 3000,
        });
        navigate("/exam-management/exams");
      }
    };

    socket.on("exam_updated", handleExamUpdated);
    socket.on("exam_group_deleted", handleExamGroupDeleted);

    return () => {
      socket.off("exam_updated", handleExamUpdated);
      socket.off("exam_group_deleted", handleExamGroupDeleted);
    };
  }, [socket, isConnected, examGroupId, refetchExamData, navigate]);

  // Helper function to convert Date to datetime-local format
  const toDatetimeLocal = (value: Date | string | null | undefined): string => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const formatTime = (value: Date | string | null | undefined) => {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (examGroupId) {
      fetchExamGroupById(Number(examGroupId)).then((data) => {
        setExamGroup(data);
        // Set admit card dates if they exist
        if (data.exams[0]?.admitCardStartDownloadDate) {
          setAdmitCardStartDate(toDatetimeLocal(data.exams[0]?.admitCardStartDownloadDate));
        }
        if (data.exams[0]?.admitCardLastDownloadDate) {
          setAdmitCardEndDate(toDatetimeLocal(data.exams[0]?.admitCardLastDownloadDate));
        }
      });
      fetchExamGroupPapersStatsByExamId(Number(examGroupId)).then((data) => {
        console.log("ExamPapersWithStats: ", data);
        setExamPapersWithStats(data);
      });
    }
  }, [examGroupId]);

  const handleUpdateAdmitCardDates = async () => {
    if (!examGroupId) return;

    try {
      setUpdatingDates(true);
      const updatedExamGroup = await updateExamAdmitCardDates(
        Number(examGroupId),
        admitCardStartDate && admitCardStartDate.trim() !== "" ? new Date(admitCardStartDate).toISOString() : null,
        admitCardEndDate && admitCardEndDate.trim() !== "" ? new Date(admitCardEndDate).toISOString() : null,
      );
      setExamGroup(updatedExamGroup);
      setAdmitCardDatesDialogOpen(false);
      toast.success("Admit card dates updated successfully");
    } catch (error) {
      console.error("Error updating admit card dates:", error);
      toast.error("Failed to update admit card dates");
    } finally {
      setUpdatingDates(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!examGroupId) return;
    try {
      setDeletingExam(true);
      await deleteExamGroupById(Number(examGroupId));
      toast.success("Exam group deleted successfully");
      setDeleteDialogOpen(false);
      navigate("/dashboard/exam-management/exams");
    } catch (error: any) {
      console.error("Error deleting exam group:", error);
      toast.error(error?.response?.data?.message || "Failed to delete exam group");
    } finally {
      setDeletingExam(false);
    }
  };

  // const formatExamDateRange = (examSubjects: ExamSubjectDto[]) => {
  //   if (!examSubjects || examSubjects.length === 0) return "-";

  //   // Extract and parse dates
  //   const dates = examSubjects.map((es) => ({
  //     start: new Date(es.startTime),
  //     end: new Date(es.endTime),
  //   }));

  //   // Find min start and max end
  //   const minStart = new Date(Math.min(...dates.map((d) => d.start.getTime())));
  //   const maxEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));

  //   // Format helper: dd/MM/yyyy
  //   const formatDate = (date: Date): string => {
  //     const day = String(date.getDate()).padStart(2, "0");
  //     const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  //     const year = date.getFullYear();
  //     return `${day}/${month}/${year}`;
  //   };

  //   // Check if ALL subjects are on the exact same day (compare date parts only)
  //   const allSameDay = dates.every((d) => {
  //     return (
  //       d.start.getDate() === minStart.getDate() &&
  //       d.start.getMonth() === minStart.getMonth() &&
  //       d.start.getFullYear() === minStart.getFullYear() &&
  //       d.end.getDate() === minStart.getDate() &&
  //       d.end.getMonth() === minStart.getMonth() &&
  //       d.end.getFullYear() === minStart.getFullYear()
  //     );
  //   });

  //   if (allSameDay) {
  //     return formatDate(minStart); // Show only one date
  //   }

  //   return `${formatDate(minStart)} - ${formatDate(maxEnd)}`;
  // };

  const downloadAdmitCard = async () => {
    // // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    // const yearMatch = selectedAcademicYear?.year?.match(/^(\d{4})/);
    // const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Generate a unique session ID for socket progress tracking
    const sessionId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update progress for CU registration documents download (Socket.IO will handle live updates)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString(),
      type: "download_progress", // Changed back to download_progress for Socket.IO
      message: `Starting Admit Card Downloading...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    const result = await ExportService.downloadExamAdmitCardsbyExamGroupId(
      Number(examGroupId),
      sessionId, // Pass session ID for Socket.IO tracking
    );

    if (result.success && result.data) {
      // Trigger download
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);

      // Update progress to completed state (this might be overridden by socket updates, but good fallback)
      setCurrentProgressUpdate({
        id: sessionId,
        userId: user!.id!.toString()!,
        type: "download_progress",
        message: `All admit-card pdfs documents downloaded successfully!`,
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });

      toast.success(`All admit-card pdfs documents downloaded successfully!`);
    } else {
      throw new Error(result.message || "Download failed");
    }
  };

  const downloadAttendanceSheets = async () => {
    // // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    // const yearMatch = selectedAcademicYear?.year?.match(/^(\d{4})/);
    // const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Generate a unique session ID for socket progress tracking
    const sessionId = `download-attendance-sheets-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update progress for CU registration documents download (Socket.IO will handle live updates)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString(),
      type: "download_progress", // Changed back to download_progress for Socket.IO
      message: `Starting Attendance Downloading...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    const result = await ExportService.downloadExamAttendanceSheetsbyExamGroupId(
      Number(examGroupId),
      sessionId, // Pass session ID for Socket.IO tracking
    );

    if (result.success && result.data) {
      // Trigger download
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);

      // Update progress to completed state (this might be overridden by socket updates, but good fallback)
      setCurrentProgressUpdate({
        id: sessionId,
        userId: user!.id!.toString()!,
        type: "download_progress",
        message: `All attendance-sheets pdfs documents downloaded successfully!`,
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });

      toast.success(`All attendance-sheets pdfs documents downloaded successfully!`);
    } else {
      throw new Error(result.message || "Download failed");
    }
  };

  const triggerAdmitCard = async () => {
    // Generate a unique session ID for socket progress tracking
    const sessionId = `send-exam-admit-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update progress for sending admit cards (Socket.IO will handle live updates)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString(),
      type: "in_progress",
      message: `Sending Admit Cards to the students...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    await triggerExamAdmitCardByExamGroupId(
      Number(examGroupId),
      sessionId, // Pass session ID for Socket.IO tracking
    );

    // Update progress to completed state (this might be overridden by socket updates, but good fallback)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString()!,
      type: "in_progress",
      message: `All admit-card pdfs documents sent successfully!`,
      progress: 100,
      status: "completed",
      createdAt: new Date(),
    });

    toast.success(`All admit-card pdfs documents sent successfully!`);
  };

  const handleDownloadAdmitCard = async () => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);

      // Set initial progress
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: "Starting export process...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });

      await downloadAdmitCard();
    } catch (error) {
      console.error(`Download failed for admit-card:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Determine if it's a "no admit cards" error
      const isNoAdmitCardsError =
        errorMessage.toLowerCase().includes("no admit cards") || errorMessage.toLowerCase().includes("not available");

      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: isNoAdmitCardsError ? "No admit cards available for download" : "Download failed due to an error",
        progress: 0,
        status: "error",
        error: errorMessage,
        createdAt: new Date(),
      });
      setIsExporting(false);

      // Show user-friendly toast message
      if (isNoAdmitCardsError) {
        toast.error("No Admit Cards Available", {
          description:
            "There are no admit cards available for this exam. Please ensure students have been assigned to exam rooms and admit cards have been generated.",
          duration: 5000,
        });
      } else {
        toast.error("Download Failed", {
          description: errorMessage,
          duration: 5000,
        });
      }
    }
  };

  const handleDownloadAttendanceSheets = async () => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);

      // Set initial progress
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: "Starting export process...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });

      await downloadAttendanceSheets();
    } catch (error) {
      console.error(`Download failed for attendance sheets:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Determine if it's a "no attendance sheets" error
      const rawMessage = errorMessage.toLowerCase();
      const isNoSheetsError =
        rawMessage.includes("no attendance") ||
        (rawMessage.includes("attendance") && rawMessage.includes("not found")) ||
        (rawMessage.includes("attendance") && rawMessage.includes("found")) ||
        rawMessage.includes("not available");

      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: isNoSheetsError ? "No attendance sheets available for download" : "Download failed due to an error",
        progress: 0,
        status: "error",
        error: errorMessage,
        createdAt: new Date(),
      });
      setIsExporting(false);

      // Show user-friendly toast message
      if (isNoSheetsError) {
        toast.error("No Attendance Sheets Available", {
          description:
            "No attendance sheets are available for this exam. This usually means that students have not been assigned to exam rooms yet. Please complete the exam room allocation process before downloading attendance sheets.",
          duration: 6000,
        });
      } else {
        toast.error("Download Failed", {
          description: errorMessage,
          duration: 5000,
        });
      }
    }
  };

  const handleTriggerAdmitCard = async () => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);

      // Set initial progress
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "in_progress",
        message: "Starting admit card trigger process...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });

      await triggerAdmitCard();
    } catch (error) {
      console.error(`Failed to send admit cards:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Determine error type for better messaging
      const rawMessage = errorMessage.toLowerCase();
      const isNoAdmitCardsError =
        rawMessage.includes("no admit cards") ||
        rawMessage.includes("not found") ||
        rawMessage.includes("no candidates") ||
        rawMessage.includes("not available");
      const isEmailError = rawMessage.includes("email") || rawMessage.includes("send") || rawMessage.includes("mail");

      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "in_progress",
        message: isNoAdmitCardsError ? "No admit cards available to send" : "Failed to send admit cards",
        progress: 0,
        status: "error",
        error: errorMessage,
        createdAt: new Date(),
      });
      setIsExporting(false);

      // Show user-friendly toast message
      if (isNoAdmitCardsError) {
        toast.error("No Admit Cards Available", {
          description:
            "No admit cards are available to send. Please ensure students have been assigned to exam rooms and admit cards have been generated before sending them via email.",
          duration: 6000,
        });
      } else if (isEmailError) {
        toast.error("Failed to Send Admit Cards", {
          description: errorMessage,
          duration: 6000,
        });
      } else {
        toast.error("Send Failed", {
          description:
            errorMessage ||
            "An error occurred while sending admit cards. Please try again later or contact support if the issue persists.",
          duration: 6000,
        });
      }
    }
  };

  const handleDownloadAdmitCardTracking = async () => {
    if (!examGroupId) return;

    try {
      const { downloadUrl, fileName } = await downloadAdmitCardTracking(Number(examGroupId));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Admit card tracking Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading admit card tracking:", error);
      toast.error("Failed to download admit card tracking");
    }
  };

  return (
    <>
      <div className="p-4 pb-24">
        <p className="pb-2">{examGroup?.name}</p>
        {/* Page Header */}
        <div className="border">
          {/* Fixed Header */}
          <div
            className="sticky top-0 z-50 text-[14px] text-gray-500 bg-gray-100 border-b"
            style={{ minWidth: "950px" }}
          >
            <div className="flex">
              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center text-[14px] justify-center"
                style={{ width: "15%" }}
              >
                Exam Type
              </div>
              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
                style={{ width: "45%" }}
              >
                Program Courses
              </div>

              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
                style={{ width: "15%" }}
              >
                Shift(s)
              </div>
              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
                style={{ width: "15%" }}
              >
                Admit Card Window
              </div>
              {/* <div
              className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
              style={{ width: "20%" }}
            >
              Subjects
            </div>
            <div
              className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
              style={{ width: "12%" }}
            >
              Category
            </div> */}
              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
                style={{ width: "10%" }}
              >
                Semester
              </div>
            </div>
          </div>
          {/* {JSON.stringify(exam)} */}
          {examGroup && (
            <div className="border-b hover:bg-gray-50 group" style={{ minWidth: "950px" }}>
              <div key={examGroup?.id} className="flex">
                <div className="flex-shrink-0 p-3 border-r  items-center gap-2 flex flex-col" style={{ width: "15%" }}>
                  {/* Display exam component names */}
                  <p>
                    <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                      {examGroup?.exams[0]?.examType.name}
                    </Badge>
                  </p>
                  {examGroup && (
                    <p className="text-center"> {new Date(examGroup.examCommencementDate).toLocaleDateString("en")}</p>
                  )}
                </div>
                <div className="p-3 border-r flex gap-1 flex-col items-center" style={{ width: "45%" }}>
                  {Array.from(
                    new Map(
                      examGroup.exams.flatMap((ep) => ep.examProgramCourses).map((pc) => [pc.programCourse.id, pc]),
                    ).values(),
                  ).map((pc, index) => (
                    <p key={`pc-index-${index}`}>
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                        {pc.programCourse.name}
                      </Badge>
                    </p>
                  ))}
                </div>

                <div
                  className="flex-shrink-0 p-3 border-r flex flex-col gap-1 items-center justify-center text-sm font-medium"
                  style={{ width: "15%" }}
                >
                  {Array.from(
                    new Map(
                      examGroup.exams.flatMap((ep) => ep.examShifts).map((esh) => [esh.shift.id, esh.shift]),
                    ).values(),
                  ).map((shift) => (
                    <p key={shift.id}>
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                        {shift.name}
                      </Badge>
                    </p>
                  ))}
                </div>

                <div className="flex-shrink-0 p-3 border-r flex flex-col justify-center" style={{ width: "15%" }}>
                  <div className="text-[11px] leading-4 text-slate-700 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-600 whitespace-nowrap">Start</span>
                      <span className="text-right whitespace-nowrap">
                        {formatDate(examGroup.exams[0]?.admitCardStartDownloadDate)}{" "}
                        {formatTime(examGroup.exams[0]?.admitCardStartDownloadDate)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-600 whitespace-nowrap">End</span>
                      <span className="text-right whitespace-nowrap">
                        {formatDate(examGroup.exams[0]?.admitCardLastDownloadDate)}{" "}
                        {formatTime(examGroup.exams[0]?.admitCardLastDownloadDate)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "20%" }}>
              <div className="mt-1 flex flex-col gap-1">
                {exam?.examSubjects.map((es) => (
                  <p>
                    <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                      {es.subject?.name ?? "-"}
                    </Badge>
                  </p>
                ))}
              </div>
            </div>

            <div
              className="flex-shrink-0 p-3 border-r flex gap-1 flex-col items-center justify-center"
              style={{ width: "12%" }}
            >
              {exam?.examSubjectTypes.map((est) => (
                <p>
                  <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                    {est.subjectType?.code ?? "-"}
                  </Badge>
                </p>
              ))}
            </div> */}

                <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: "10%" }}>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                    {examGroup.exams?.[0]?.class.name.split(" ")[1]}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        {examGroup && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 p-3 pl-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleDownloadAdmitCard} className="p-2">
                      <IdCard className="h-4 w-4" size={21} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Download Admit Cards</p>
                      <p className="text-xs text-gray-400">Download all admit cards as a ZIP file</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleDownloadAttendanceSheets} className="p-2">
                      <Sheet className="h-4 w-4" size={21} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Download Attendance Sheets</p>
                      <p className="text-xs text-gray-400">Download attendance sheets for all exam rooms</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetchExamCandidatesByExamIdOrExamGroupId(
                            undefined,
                            Number(examGroupId!),
                          );
                          ExportService.downloadFile(response.downloadUrl, response.fileName);
                        } catch (error: any) {
                          toast.error(error?.message || "Failed to download exam candidates. Please try again.");
                        }
                      }}
                      className="p-2"
                    >
                      <UsersRound className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Download Students</p>
                      <p className="text-xs text-gray-400">Export student list for this exam as Excel</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setSendAdmitCardDialogOpen(true)} className="p-2">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Send Admit Cards</p>
                      <p className="text-xs text-gray-400">Email admit cards to all students</p>
                    </div>
                  </TooltipContent>
                </Tooltip> */}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleDownloadAdmitCardTracking} className="p-2">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Download Admit Card Tracking</p>
                      <p className="text-xs text-gray-400">
                        Export download tracking report with counts and timestamps
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAdmitCardDatesDialogOpen(true);
                      }}
                      className="p-2"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Update Admit Card Dates</p>
                      <p className="text-xs text-gray-400">Set the date range when students can download admit cards</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    {canDeleteExam ? (
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        size={"sm"}
                        className="p-2"
                      >
                        <Trash2 className="h-4" />
                      </Button>
                    ) : (
                      <span />
                    )}
                  </TooltipTrigger>
                  {canDeleteExam ? (
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-semibold">Delete Exam</p>
                        <p className="text-xs text-gray-400">
                          Allowed only up to 1 day before admit card start download date
                        </p>
                      </div>
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Content */}
        {examGroup && examPapersWithStats && examPapersWithStats.length > 0 ? (
          <div className="w-full flex py-4">
            <div className="w-full border">
              {/* Fixed Header */}
              <div className="sticky top-0 z-50 text-[14px] border-b bg-gray-100" style={{ minWidth: "950px" }}>
                <div className="flex">
                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Category
                  </div>
                  <div
                    className="flex-shrink-0   font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "18.5%" }}
                  >
                    Subjects / Papers
                  </div>

                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Code
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Date
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Time
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Students
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500  font-bold p-1 border-r flex items-center justify-center"
                    style={{ width: "12.5%" }}
                  >
                    Present
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-1 flex items-center justify-center"
                    style={{ width: "6.5%" }}
                  >
                    Actions
                  </div>
                </div>
              </div>

              {/* {JSON.stringify(examPapersWithStats)} */}

              {examPapersWithStats?.map((eps, index) => {
                const exam = examGroup.exams.find((e) => e.id === eps.examId)!;
                return eps.examPapers?.map((ep, epIdx) => (
                  <ExamPaperRow
                    key={`eps-${index}-ep-${epIdx}`}
                    exam={exam}
                    examPapersWithStat={ep}
                    onEdit={(examSubject) => {
                      setSelectedExamSubject(examSubject);
                      setEditSubjectOpen(true);
                    }}
                  />
                ));
              })}
            </div>
          </div>
        ) : examGroup ? (
          <div className="py-6 text-center text-sm text-slate-600">No paper</div>
        ) : null}
      </div>

      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setIsExporting(false);
          setCurrentProgressUpdate(null);
        }}
        progressUpdate={currentProgressUpdate}
      />

      <EditExamSubjectDialog
        open={editSubjectOpen}
        examSubject={selectedExamSubject}
        onClose={() => setEditSubjectOpen(false)}
        onSave={async (updated) => {
          // 🔥 Save to backend
          const response = await updateExamSubject(updated.id!, updated);
          console.log("updated response from examSubject:", response);
          const newExams = examGroup?.exams.map((exm) => {
            if (exm.id !== response.examId) return exm;

            return {
              ...exm,
              examSubjects: exm.examSubjects.filter((es) => es.id !== response.id).concat(response),
            };
          });

          // 🔥 Update local state using backend response
          setExamGroup((prev) => ({ ...prev!, exams: newExams! }));

          toast.success("Exam schedule updated");
        }}
      />

      {/* Admit Card Dates Dialog */}
      <Dialog open={admitCardDatesDialogOpen} onOpenChange={setAdmitCardDatesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Admit Card Download Dates</DialogTitle>
            <DialogDescription>
              Set the date range when students can download their admit cards. Leave empty if not applicable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-admit-card-start-date">Start Date & Time</Label>
              <Input
                id="dialog-admit-card-start-date"
                type="datetime-local"
                value={admitCardStartDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setAdmitCardStartDate(value);
                  if (value && admitCardEndDate && new Date(value) > new Date(admitCardEndDate)) {
                    toast.error("Start date must be before end date");
                  }
                }}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-admit-card-end-date">End Date & Time</Label>
              <Input
                id="dialog-admit-card-end-date"
                type="datetime-local"
                value={admitCardEndDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setAdmitCardEndDate(value);
                  if (value && admitCardStartDate && new Date(value) < new Date(admitCardStartDate)) {
                    toast.error("End date must be after start date");
                  }
                }}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitCardDatesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmitCardDates} disabled={updatingDates}>
              {updatingDates ? "Updating..." : "Update Dates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Admit Cards Confirmation */}
      <AlertDialog open={sendAdmitCardDialogOpen} onOpenChange={setSendAdmitCardDialogOpen}>
        <AlertDialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-2xl">Send Admit Cards via Email</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 pt-2 text-base">
              <p className="text-lg font-medium text-gray-900">
                Are you sure you want to send admit cards to all students via email?
              </p>

              <div className="space-y-3 text-base text-gray-700">
                <p className="font-semibold text-lg">This action will:</p>
                <ul className="list-disc list-inside space-y-2 ml-3">
                  <li>Send admit card PDFs via email to all students assigned to exam rooms</li>
                  <li>Include exam details, room assignments, seat numbers, and exam schedule</li>
                  <li>Trigger email notifications for potentially hundreds of students</li>
                </ul>
              </div>

              <div className="rounded-lg bg-amber-50 border-2 border-amber-200 p-4 mt-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-base text-amber-800">
                    <p className="font-semibold mb-2 text-lg">Please verify before proceeding:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>All students have been correctly assigned to exam rooms</li>
                      <li>Exam schedule and room details are accurate</li>
                      <li>Email addresses are valid and up-to-date</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-base text-gray-600 mt-4">
                This process may take several minutes depending on the number of students. You can track the progress in
                the export dialog.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSendAdmitCardDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSendAdmitCardDialogOpen(false);
                handleTriggerAdmitCard();
              }}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              Yes, Send Admit Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Exam Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam and all related data (subjects, rooms, candidates).
              <span className="block mt-2 text-red-600 font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingExam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingExam}
            >
              {deletingExam ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
