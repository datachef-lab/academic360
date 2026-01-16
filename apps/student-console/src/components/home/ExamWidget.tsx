"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExamDto } from "@/dtos";
import { format } from "date-fns";
import { Calendar, Clock, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ExamWidgetProps {
  exams: ExamDto[];
}

export default function ExamWidget({ exams }: ExamWidgetProps) {
  const now = new Date();
  const nowTime = now.getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper: Check if all papers in an exam are completed
  const allPapersCompleted = (exam: ExamDto): boolean => {
    if (!exam.examSubjects || exam.examSubjects.length === 0) return true;
    // Find the last paper by end time
    const lastPaper = exam.examSubjects.reduce((latest, current) => {
      const currentEnd = new Date(current.endTime);
      const latestEnd = new Date(latest.endTime);
      return currentEnd > latestEnd ? current : latest;
    });
    return nowTime > new Date(lastPaper.endTime).getTime();
  };

  // Helper: Get next upcoming or today's paper for an exam
  const getNextPaper = (exam: ExamDto) => {
    if (!exam.examSubjects || exam.examSubjects.length === 0) return null;

    // First, check for papers today
    const todayPapers = exam.examSubjects
      .filter((s) => {
        const d = new Date(s.startTime);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime() && new Date(s.endTime).getTime() > nowTime;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (todayPapers.length > 0) return todayPapers[0];

    // If no papers today, get next upcoming paper
    const upcomingPapers = exam.examSubjects
      .filter((s) => {
        const d = new Date(s.startTime);
        d.setHours(0, 0, 0, 0);
        return d > today;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return upcomingPapers.length > 0 ? upcomingPapers[0] : null;
  };

  // Filter exams: only show if admit card dates are valid AND has upcoming/today papers
  const upcomingExams = exams
    .filter((exam) => {
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

      // 4. Check if exam has subjects
      if (!exam.examSubjects || exam.examSubjects.length === 0) {
        return false;
      }

      // 5. Don't show if all papers are completed
      if (allPapersCompleted(exam)) {
        return false;
      }

      // 6. Only show if there's at least one paper today or upcoming
      return getNextPaper(exam) !== null;
    })
    .map((exam) => ({
      exam,
      nextPaper: getNextPaper(exam)!,
    }))
    .sort((a, b) => {
      // Sort by next paper's start time
      return new Date(a.nextPaper.startTime).getTime() - new Date(b.nextPaper.startTime).getTime();
    });

  if (upcomingExams.length === 0) {
    return null;
  }

  const { exam: latestExam, nextPaper } = upcomingExams[0];

  const examDate = new Date(nextPaper.startTime);
  const isToday = examDate.toDateString() === now.toDateString();

  return (
    <Link href="/dashboard/exams" className="block">
      <Card className="border shadow-lg rounded-2xl overflow-hidden bg-white cursor-pointer hover:shadow-xl transition-shadow duration-200">
        <div className="flex h-full min-h-[200px]">
          {/* Left: Image Area */}
          <div
            className="w-1/2 bg-gradient-to-br flex items-center justify-center relative min-h-[200px]"
            style={{
              backgroundImage: `url(/exam.jpg)`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>

          {/* Right: Content Area */}
          <div className="w-1/2 flex flex-col justify-center p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Upcoming Exams</h3>
            </div>

            {/* Exam Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-800">{latestExam.examType?.name || "Exam"}</h4>
                {isToday && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full">Today</span>
                )}
              </div>

              {nextPaper.subject?.name && <p className="text-sm text-gray-600 font-medium">{nextPaper.subject.name}</p>}

              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{format(examDate, "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{format(examDate, "hh:mm a")}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center text-purple-600 text-sm font-medium">
                <span>View All Exams</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
