import React from "react";
import { ListChecks } from "lucide-react";
import { MockData } from "./data";
import AttendanceStats from "./attendance-stats";
import SubjectCard from "./subject-card";

type StatisticsContentProps = {
  mockData: MockData;
  selectedSemester: string;
};

export default function StatisticsContent({
  mockData,
  selectedSemester,
}: StatisticsContentProps) {
  const currentSubjects =
    mockData.subjects[
      selectedSemester as unknown as keyof typeof mockData.subjects
    ] || [];

  return (
    <div className="space-y-6">
      <AttendanceStats
        mockData={mockData}
        selectedSemester={selectedSemester}
      />

      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-100 shadow-md">
        <h2 className="text-xl font-bold text-indigo-800 mb-6 flex items-center">
          <ListChecks className="mr-2 h-5 w-5 text-indigo-600" />
          Subject Attendance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentSubjects.map((subject, index) => (
            <SubjectCard key={`subject-${index}`} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  );
}
