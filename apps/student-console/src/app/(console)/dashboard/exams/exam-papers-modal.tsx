"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExamCandidateDto, ExamDto } from "@/dtos";
import { fetchExamCandidates, downloadAdmitCard } from "@/services/exam-api.service";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ExamPapersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamDto | null;
  studentId: number;
}

interface PaperDetails {
  paperCode: string;
  startTime: Date;
  endTime: Date;
  room: string;
  floor: string;
  seatNumber: string;
}

export function ExamPapersModal({ open, onOpenChange, exam, studentId }: ExamPapersModalProps) {
  const [candidates, setCandidates] = useState<ExamCandidateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Validate required fields before making API call
    if (open && exam && studentId && exam.id) {
      // Ensure exam.id is a valid number
      const examId = typeof exam.id === "number" ? exam.id : Number(exam.id);

      if (isNaN(examId) || examId <= 0) {
        toast({
          title: "Invalid exam",
          description: "Exam information is missing or invalid. Please refresh or contact support.",
          variant: "destructive",
        });
        setCandidates([]);
        setLoading(false);
        return;
      }
      // sfs
      const studentIdNum = typeof studentId === "number" ? studentId : Number(studentId);
      if (isNaN(studentIdNum) || studentIdNum <= 0) {
        toast({
          title: "Invalid student",
          description: "Student information is missing or invalid. Please sign in again or contact support.",
          variant: "destructive",
        });
        setCandidates([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      fetchExamCandidates(examId, studentIdNum)
        .then((response) => {
          if (response.payload) {
            setCandidates(Array.isArray(response.payload) ? response.payload : []);
          } else {
            setCandidates([]);
          }
        })
        .catch((err) => {
          const errorMessage = err?.response?.data?.message || err?.message || "Failed to load exam papers";
          toast({
            title: "Could not load exam schedule",
            description:
              typeof errorMessage === "string"
                ? errorMessage
                : "An unexpected error occurred while loading exam papers.",
            variant: "destructive",
          });
          setCandidates([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (open) {
        // missing required data; state will reflect empty candidates
      }
      setCandidates([]);
    }
  }, [open, exam, studentId]);

  // Transform candidates into paper details by matching with exam data
  const getPaperDetails = (): PaperDetails[] => {
    if (!exam || candidates.length === 0) return [];

    return candidates
      .map((candidate) => {
        const candidateData = (candidate as any).exam_candidates ?? candidate;
        const examRoomId = candidateData?.examRoomId;
        const examSubjectId = candidateData?.examSubjectId;
        const seatNumber = candidateData?.seatNumber;
        const paper = candidate?.paper;

        if (!paper || !examSubjectId) {
          return null;
        }

        // Find matching exam subject from exam.examSubjects array
        const examSubject = exam.examSubjects?.find((subj) => subj?.id === examSubjectId);
        if (!examSubject) {
          return null;
        }

        // Room assignment is optional - if no examRoomId, show "Not assigned"
        let room = "Not assigned";
        let floor = "";
        if (examRoomId) {
          const examRoom = exam.locations?.find((loc) => loc?.id === examRoomId);
          if (examRoom && examRoom.room) {
            room = examRoom.room?.name || "Not assigned";
            floor = examRoom.room?.floor?.name || "";
          }
        }

        return {
          paperCode: paper?.code || "",
          startTime: new Date(examSubject.startTime),
          endTime: new Date(examSubject.endTime),
          room: room,
          floor: floor,
          seatNumber: seatNumber || "Not assigned",
        };
      })
      .filter((detail): detail is PaperDetails => detail !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  // Download admit card handler
  const handleDownloadAdmitCard = async () => {
    if (!exam || !studentId || !exam.id) {
      toast({
        title: "Download unavailable",
        description: "Missing exam or student information. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    // Ensure exam.id is a valid number
    const examId = typeof exam.id === "number" ? exam.id : Number(exam.id);
    const studentIdNum = typeof studentId === "number" ? studentId : Number(studentId);

    if (isNaN(examId) || examId <= 0) {
      toast({
        title: "Invalid exam",
        description: "Exam information is invalid. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(studentIdNum) || studentIdNum <= 0) {
      toast({
        title: "Invalid student",
        description: "Student information is invalid. Please sign in again or contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloading(true);
      const blob = await downloadAdmitCard(examId, studentIdNum);

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const newTab = window.open(url, "_blank");

      if (newTab) {
        newTab.addEventListener("load", () => window.URL.revokeObjectURL(url));
      } else {
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Failed to download admit card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const paperDetails = getPaperDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[85vh] border-none overflow-hidden shadow-elevated rounded-xl">
        <DialogHeader className="bg-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-semibold text-white tracking-tight">Exam Schedule</DialogTitle>
              <p className="text-white/80 text-sm font-medium"></p>
            </div>
            {paperDetails.length > 0 &&
              (() => {
                const now = new Date();
                const nowTime = now.getTime();

                // Check if current time is within the admit card download window
                const startDate = exam?.admitCardStartDownloadDate
                  ? new Date(exam.admitCardStartDownloadDate).getTime()
                  : null;
                const endDate = exam?.admitCardLastDownloadDate
                  ? new Date(exam.admitCardLastDownloadDate).getTime()
                  : null;

                // Show button only if within download window
                const isWithinWindow = startDate && nowTime >= startDate && (!endDate || nowTime <= endDate);

                if (!isWithinWindow) {
                  return null; // Hide button if outside download window
                }

                return (
                  <Button
                    onClick={handleDownloadAdmitCard}
                    disabled={downloading || loading}
                    title="Download admit card"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download admit card"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 text-white shrink-0" />
                        <span>Admit Card</span>
                      </>
                    )}
                  </Button>
                );
              })()}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading exam papers...</span>
          </div>
        ) : paperDetails.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No exam papers found for this exam.</p>
          </div>
        ) : (
          <div className=" rounded-md after:shadow-md  overflow-hidden flex-1 flex flex-col">
            <Table>
              <TableHeader className="bg-gray-200 ">
                <TableRow className=" bg-gray-200 hover:bg-gray-200">
                  <TableHead className="text-gray-800 font-semibold text-xs uppercase tracking-wider  py-4 pl-6 pr-4 ">
                    Date & Time
                  </TableHead>
                  <TableHead className="text-gray-800 font-semibold text-xs uppercase tracking-wider  py-3 px-4">
                    Venue
                  </TableHead>
                  <TableHead className="text-gray-800 font-semibold text-xs text-center uppercase tracking-wider py-3 px-2">
                    Subject / Paper
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="overflow-auto max-h-[400px] thin-scrollbar">
              <Table>
                <TableBody>
                  {paperDetails.map((detail, index) => (
                    <TableRow key={index} className="border-b border-gray-200 hover:bg-white">
                      <TableCell className="py-4 pl-6 pr-4 ">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-800 text-sm">
                            {format(detail.startTime, "dd/MM/yyyy")}
                          </div>
                          <div className="text-muted-gray-800 text-xs font-mono">
                            {format(detail.startTime, "hh:mm a")} – {format(detail.endTime, "hh:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 ">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-800 text-sm">
                            {detail.room === "Not assigned" ? (
                              <span className="text-gray-500 italic">Room: Not assigned</span>
                            ) : (
                              <>Room: {detail.room}</>
                            )}
                          </div>
                          <div className="text-muted-gray-800 text-xs flex items-center font-mono gap-1.5">
                            {detail.floor ? (
                              <>
                                {detail.floor} •
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-600/10 font-mono text-accent-gray-800 text-xs font-medium">
                                  Seat: {detail.seatNumber}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-500 italic">Seat not assigned</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-2 ">
                        <div className="text-muted-gray-800  text-sm ">{detail.paperCode}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
