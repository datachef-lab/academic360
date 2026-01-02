"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExamCandidateDto, ExamDto } from "@/dtos";
import { fetchExamCandidates, downloadAdmitCard } from "@/services/exam-api.service";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Hash, Loader2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    // Validate required fields before making API call
    if (open && exam && studentId && exam.id) {
      // Ensure exam.id is a valid number
      const examId = typeof exam.id === "number" ? exam.id : Number(exam.id);

      if (isNaN(examId) || examId <= 0) {
        console.error("Invalid exam.id:", exam.id, "Type:", typeof exam.id);
        setError(`Invalid exam ID: ${exam.id}`);
        setCandidates([]);
        setLoading(false);
        return;
      }

      const studentIdNum = typeof studentId === "number" ? studentId : Number(studentId);
      if (isNaN(studentIdNum) || studentIdNum <= 0) {
        console.error("Invalid studentId:", studentId, "Type:", typeof studentId);
        setError(`Invalid student ID: ${studentId}`);
        setCandidates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log("Fetching exam candidates with:", { examId, studentId: studentIdNum, examObject: exam });

      fetchExamCandidates(examId, studentIdNum)
        .then((response) => {
          if (response.payload) {
            setCandidates(Array.isArray(response.payload) ? response.payload : []);
          } else {
            setCandidates([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching exam candidates:", err);
          console.error("Error details:", {
            message: err?.message,
            response: err?.response?.data,
            status: err?.response?.status,
            examId,
            studentId: studentIdNum,
          });

          const errorMessage = err?.response?.data?.message || err?.message || "Failed to load exam papers";
          setError(errorMessage);
          setCandidates([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (open) {
        console.warn("Missing required data:", {
          exam: !!exam,
          examId: exam?.id,
          studentId,
          open,
        });
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

        if (!paper || !examRoomId || !examSubjectId) {
          console.warn("Missing required data in candidate:", { candidate, candidateData });
          return null;
        }

        // Find matching exam room from exam.locations array
        const examRoom = exam.locations?.find((loc) => loc?.id === examRoomId);
        if (!examRoom || !examRoom.room) {
          console.warn(`Exam room not found for examRoomId: ${examRoomId}`, exam.locations);
          return null;
        }

        // Find matching exam subject from exam.examSubjects array
        const examSubject = exam.examSubjects?.find((subj) => subj?.id === examSubjectId);
        if (!examSubject) {
          console.warn(`Exam subject not found for examSubjectId: ${examSubjectId}`, exam.examSubjects);
          return null;
        }

        return {
          paperCode: paper?.code || "",
          startTime: new Date(examSubject.startTime),
          endTime: new Date(examSubject.endTime),
          room: examRoom.room?.name || "",
          floor: examRoom.room?.floor?.name || "",
          seatNumber: seatNumber || "",
        };
      })
      .filter((detail): detail is PaperDetails => detail !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  // Download admit card handler
  const handleDownloadAdmitCard = async () => {
    if (!exam || !studentId || !exam.id) {
      setDownloadError("Missing exam or student information");
      return;
    }

    // Ensure exam.id is a valid number
    const examId = typeof exam.id === "number" ? exam.id : Number(exam.id);
    const studentIdNum = typeof studentId === "number" ? studentId : Number(studentId);

    if (isNaN(examId) || examId <= 0) {
      setDownloadError(`Invalid exam ID: ${exam.id}`);
      return;
    }

    if (isNaN(studentIdNum) || studentIdNum <= 0) {
      setDownloadError(`Invalid student ID: ${studentId}`);
      return;
    }

    try {
      setDownloading(true);
      setDownloadError(null);
      const blob = await downloadAdmitCard(examId, studentIdNum);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admit-card-${examId}-${studentIdNum}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading admit card:", err);
      setDownloadError("Failed to download admit card. Please try again.");
      // Clear error after 5 seconds
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const paperDetails = getPaperDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Exam Papers & Details</DialogTitle>
            {paperDetails.length > 0 && (
              <Button
                onClick={handleDownloadAdmitCard}
                disabled={downloading || loading}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                aria-label="Download admit card"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Download className="h-5 w-5 text-white" />
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {downloadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{downloadError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading exam papers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : paperDetails.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No exam papers found for this exam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date & Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Venue</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Subject / Paper</th>
                </tr>
              </thead>
              <tbody>
                {paperDetails.map((detail, index) => (
                  <tr key={index} className="border-t last:border-b">
                    <td className="px-4 py-3 align-top text-gray-700">
                      <div className="font-medium">{format(detail.startTime, "MMM d, yyyy")}</div>
                      <div className="text-gray-500 text-xs">
                        {format(detail.startTime, "hh:mm a")} - {format(detail.endTime, "hh:mm a")}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      <div className="font-medium">{detail.room}</div>
                      <div className="text-gray-500 text-xs">
                        {detail.floor} • Seat:{" "}
                        <span className="font-semibold text-indigo-600">{detail.seatNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">{detail.paperCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
