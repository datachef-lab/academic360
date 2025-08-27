import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BatchCustom } from "@/types/academics/batch";
import { Student } from "@/types/academics/student";

export default function BasicInfo({
  student,
  batches,
}: {
  student: Student;
  batches: BatchCustom[];
}) {
  return (
    <Card className="border-0 py-4 pb-7 shadow-md rounded-2xl overflow-hidden bg-white">
      <CardHeader className="pb-2 pt-3 px-5 mb-5">
        <CardTitle className="text-base font-semibold text-black">
          Basic Info
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-3 pt-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Course</span>
          <span className="font-semibold text-gray-800 text-base">
            {batches[0]?.coursename}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">
            Semester
            <span className="text-red-500">{student.active ? "*" : ""}</span>
          </span>
          <span className="font-semibold text-gray-800 text-base">
            {batches[batches.length - 1]?.classname}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Section</span>
          <span className="font-semibold text-gray-800 text-base">
            {batches[batches.length - 1]?.sectionName || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">CU Registration Number</span>
          <span className="font-semibold text-gray-800 text-base">
            {student?.univregno}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">CU Roll Number</span>
          <span className="font-semibold text-gray-800 text-base">
            {student?.univlstexmrollno}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Shift & Session</span>
          <span className="font-semibold text-gray-800 text-base">
            {batches[batches.length - 1]?.shiftName || "N/A"} |{" "}
            {batches[batches.length - 1]?.sessionName || "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
