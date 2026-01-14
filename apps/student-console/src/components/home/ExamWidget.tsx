"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExamDto } from "@/dtos";
import { format } from "date-fns";
import { Calendar, Clock, GraduationCap, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ExamWidgetProps {
  exams: ExamDto[];
}

export default function ExamWidget({ exams }: ExamWidgetProps) {
  // Filter exams: only show if admit card dates are valid
  // Widget should NOT display if:
  // 1. Admit card start date is not there
  // 2. Admit card start date > current time
  // 3. Admit card end date < current time (if exists)
  const upcomingExams = exams.filter((exam) => {
    const now = new Date();
    const nowTime = now.getTime();

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

    // Get the first subject start time and last subject end time
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

  // Sort by start time (earliest first) and take the first one
  const latestExam = upcomingExams.sort((a, b) => {
    const aStart = new Date(a.examSubjects[0]?.startTime || 0).getTime();
    const bStart = new Date(b.examSubjects[0]?.startTime || 0).getTime();
    return aStart - bStart;
  })[0];

  if (!latestExam) {
    return null;
  }

  const firstSubject = latestExam.examSubjects?.[0];
  if (!firstSubject) return null;

  const examDate = new Date(firstSubject.startTime);
  const now = new Date();
  const isToday = examDate.toDateString() === now.toDateString();

  const roomName = latestExam.locations?.[0]?.room?.name || "";
  const floorName = latestExam.locations?.[0]?.room?.floor?.name || "";

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

              {firstSubject.subject?.name && (
                <p className="text-sm text-gray-600 font-medium">{firstSubject.subject.name}</p>
              )}

              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{format(examDate, "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{format(examDate, "hh:mm a")}</span>
                </div>
                {roomName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {roomName}
                      {floorName && ` (${floorName})`}
                    </span>
                  </div>
                )}
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
