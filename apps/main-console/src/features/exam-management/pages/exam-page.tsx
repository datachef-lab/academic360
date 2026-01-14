import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExamDto, ExamPapersWithStats, ExamSubjectDto } from "@/dtos";
import {
  downloadAdmitCardTracking,
  fetchExamById,
  fetchExamCandidatesByExamId,
  fetchExamPapersStatsByExamId,
  triggerExamAdmitCardByExamId,
  updateExamSubject,
} from "@/services/exam.service";

import { IdCard, Mail, Sheet, Trash2, UsersRound, Download, Calendar } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ExamPaperRow from "../components/exam-paper-row";
import { ProgressUpdate } from "@/types/progress";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ExportService } from "@/services/exportService";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { useSocket } from "@/hooks/useSocket";
import { EditExamSubjectDialog } from "../components/edit-exam-subject-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

export default function ExamPage() {
  const { user } = useAuth();
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamDto | null>(null);
  const [examPapersWithStats, setExamPapersWithStats] = useState<ExamPapersWithStats[]>([]);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [selectedExamSubject, setSelectedExamSubject] = useState<ExamSubjectDto | null>(null);
  const [admitCardDatesDialogOpen, setAdmitCardDatesDialogOpen] = useState(false);
  const [admitCardStartDate, setAdmitCardStartDate] = useState<string>("");
  const [admitCardEndDate, setAdmitCardEndDate] = useState<string>("");
  const [updatingDates, setUpdatingDates] = useState(false);

  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const setIsExporting = useState(false)[1];
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);

  const userId = (user?.id ?? "").toString();

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
  useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  // Helper function to convert Date to datetime-local format
  const toDatetimeLocal = (value: Date | string | null | undefined): string => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (examId) {
      fetchExamById(Number(examId)).then((data) => {
        setExam(data);
        // Set admit card dates if they exist
        if (data.admitCardStartDownloadDate) {
          setAdmitCardStartDate(toDatetimeLocal(data.admitCardStartDownloadDate));
        }
        if (data.admitCardLastDownloadDate) {
          setAdmitCardEndDate(toDatetimeLocal(data.admitCardLastDownloadDate));
        }
      });
      fetchExamPapersStatsByExamId(Number(examId)).then((data) => {
        console.log("ExamPapersWithStats: ", data);
        setExamPapersWithStats(data);
      });
    }
  }, [examId]);

  const handleUpdateAdmitCardDates = async () => {
    if (!examId) return;

    try {
      setUpdatingDates(true);
      const updatedExam = await updateExamAdmitCardDates(
        Number(examId),
        admitCardStartDate && admitCardStartDate.trim() !== "" ? new Date(admitCardStartDate).toISOString() : null,
        admitCardEndDate && admitCardEndDate.trim() !== "" ? new Date(admitCardEndDate).toISOString() : null,
      );
      setExam(updatedExam);
      setAdmitCardDatesDialogOpen(false);
      toast.success("Admit card dates updated successfully");
    } catch (error) {
      console.error("Error updating admit card dates:", error);
      toast.error("Failed to update admit card dates");
    } finally {
      setUpdatingDates(false);
    }
  };

  const formatExamDateRange = (examSubjects: ExamSubjectDto[]) => {
    if (!examSubjects || examSubjects.length === 0) return "-";

    // Extract and parse dates
    const dates = examSubjects.map((es) => ({
      start: new Date(es.startTime),
      end: new Date(es.endTime),
    }));

    // Find min start and max end
    const minStart = new Date(Math.min(...dates.map((d) => d.start.getTime())));
    const maxEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));

    // Format helper: dd/MM/yyyy
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Check if ALL subjects are on the exact same day (compare date parts only)
    const allSameDay = dates.every((d) => {
      return (
        d.start.getDate() === minStart.getDate() &&
        d.start.getMonth() === minStart.getMonth() &&
        d.start.getFullYear() === minStart.getFullYear() &&
        d.end.getDate() === minStart.getDate() &&
        d.end.getMonth() === minStart.getMonth() &&
        d.end.getFullYear() === minStart.getFullYear()
      );
    });

    if (allSameDay) {
      return formatDate(minStart); // Show only one date
    }

    return `${formatDate(minStart)} - ${formatDate(maxEnd)}`;
  };

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

    const result = await ExportService.downloadExamAdmitCardsbyExamId(
      Number(examId),
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

    const result = await ExportService.downloadExamAttendanceSheetsbyExamId(
      Number(examId),
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
    // // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    // const yearMatch = selectedAcademicYear?.year?.match(/^(\d{4})/);
    // const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Generate a unique session ID for socket progress tracking
    const sessionId = `send-exam-admit-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update progress for CU registration documents download (Socket.IO will handle live updates)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString(),
      type: "in_progress", // Changed back to download_progress for Socket.IO
      message: `Sending Admit Cards to the students...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    await triggerExamAdmitCardByExamId(
      Number(examId),
      sessionId, // Pass session ID for Socket.IO tracking
    );

    // Update progress to completed state (this might be overridden by socket updates, but good fallback)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: user!.id!.toString()!,
      type: "download_progress",
      message: `All admit-card pdfs documents downloaded successfully!`,
      progress: 100,
      status: "completed",
      //   fileName: result.data?.fileName,
      //   downloadUrl: result.data?.downloadUrl,
      createdAt: new Date(),
    });

    toast.success(`All admit-card pdfs documents sent successfully!`);

    // if (result.success && result.data) {
    //   // Trigger download
    //   ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
    // } else {
    //   throw new Error(result.message || "Download failed");
    // }
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
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: "Export failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      setIsExporting(false);
      toast.error(`Failed to download for admit-card`);
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
      console.error(`Download failed for admit-card:`, error);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "export_progress",
        message: "Export failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      setIsExporting(false);
      toast.error(`Failed to download for admit-card`);
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
      console.error(`Download failed for admit-card:`, error);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: user!.id!.toString(),
        type: "in_progress",
        message: "Triggered failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      setIsExporting(false);
      toast.error(`Failed to send the admit-card`);
    }
  };

  const handleDownloadAdmitCardTracking = async () => {
    if (!examId) return;

    try {
      const { downloadUrl, fileName } = await downloadAdmitCardTracking(Number(examId));
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
      <div className="p-4">
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
                style={{ width: "55%" }}
              >
                Program Courses
              </div>

              <div
                className="flex-shrink-0 text-gray-500 font-bold p-1 border-r flex items-center justify-center"
                style={{ width: "15%" }}
              >
                Shift(s)
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
                style={{ width: "15%" }}
              >
                Semester
              </div>
            </div>
          </div>
          {/* {JSON.stringify(exam)} */}
          {exam && (
            <div key={exam?.id} className="flex border-b hover:bg-gray-50 group" style={{ minWidth: "950px" }}>
              <div className="flex-shrink-0 p-3 border-r  items-center gap-2 flex flex-col" style={{ width: "15%" }}>
                {/* Display exam component names */}
                <p>
                  <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                    {exam?.examType.name}
                  </Badge>
                </p>
                {exam && <p className="text-center">{formatExamDateRange(exam!.examSubjects!)}</p>}
              </div>
              <div className="p-3 border-r flex gap-1 flex-col items-center" style={{ width: "55%" }}>
                {exam?.examProgramCourses.map((pc, pcIndex) => (
                  <p>
                    <Badge
                      key={`pc-index-${pcIndex}`}
                      variant="outline"
                      className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                    >
                      {pc.programCourse.name}
                    </Badge>
                  </p>
                ))}
              </div>

              <div
                className="flex-shrink-0 p-3 border-r flex flex-col gap-1 items-center justify-center text-sm font-medium"
                style={{ width: "15%" }}
              >
                {exam?.examShifts.map((esh, eshIndex) => (
                  <p>
                    <Badge
                      key={`pc-index-${eshIndex}`}
                      variant="outline"
                      className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                    >
                      {esh.shift.name}
                    </Badge>
                  </p>
                ))}
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

              <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: "15%" }}>
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                  {exam?.class.name.split(" ")[1]}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        {exam && (
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
                        const response = await fetchExamCandidatesByExamId(Number(examId!));
                        ExportService.downloadFile(response.downloadUrl, response.fileName);
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const isConfirmed = confirm(
                          "Are you sure that you want to send the admit-cards to the students (via email)?",
                        );
                        if (isConfirmed) {
                          handleTriggerAdmitCard();
                        }
                      }}
                      className="p-2"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Send Admit Cards</p>
                      <p className="text-xs text-gray-400">Email admit cards to all students</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

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
                    <Button
                      variant="destructive"
                      onClick={() => {
                        //   setIsPaperEditModalOpen(true);
                        //   setSelectedPaperForEdit(sp);
                      }}
                      size={"sm"}
                      className="p-2"
                    >
                      <Trash2 className="h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">Delete Exam</p>
                      <p className="text-xs text-gray-400">Permanently delete this exam</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Content */}
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
            {/* {JSON.stringify(exam)} */}
            {/* {JSON.stringify(examPapersWithStats.length)} */}
            {exam &&
              examPapersWithStats &&
              examPapersWithStats.map((eps, index) => (
                <ExamPaperRow
                  key={`eps-${index}`}
                  exam={exam}
                  examPapersWithStat={eps}
                  onEdit={(examSubject) => {
                    setSelectedExamSubject(examSubject);
                    setEditSubjectOpen(true);
                  }}
                />
              ))}
          </div>
        </div>
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
          // 🔥 Update local state using backend response
          setExam((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              examSubjects: prev.examSubjects.map((es) => (es.id === response.id ? response : es)),
            };
          });

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
    </>
  );
}
