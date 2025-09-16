import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BatchCustom } from "@/types/academics/batch";
import { StudentDto } from "@repo/db/dtos/user";

export default function BasicInfo({ student }: { student: StudentDto | null }) {
  return (
    <Card className="border-0 py-3 pb-4 shadow-md rounded-2xl overflow-hidden bg-white">
      <CardHeader className="pb-1 pt-2 px-5 mb-2">
        <CardTitle className="text-base font-semibold text-black">Basic Info</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-2 pt-0 space-y-0">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500 text-sm">ProgramCourse</span>
          <span className="font-semibold text-gray-800 text-base">
            {student?.currentPromotion?.programCourse?.name}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500 text-sm">
            Semester
            <span className="text-red-500">{student?.active ? "*" : ""}</span>
          </span>
          <span className="font-semibold text-gray-800 text-base">
            {student?.currentPromotion?.class?.name || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500 text-sm">Section</span>
          <span className="font-semibold text-gray-800 text-base">
            {student?.currentPromotion?.section?.name || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500 text-sm">CU Registration Number</span>
          <span className="font-semibold text-gray-800 text-base">N/A</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500 text-sm">CU Roll Number</span>
          <span className="font-semibold text-gray-800 text-base">N/A</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-gray-500 text-sm">Shift</span>
          <span className="font-semibold text-gray-800 text-base">{student?.shift?.name || "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
