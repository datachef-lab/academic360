import {
  MarksheetSummary,
  SubjectMetadataType,
} from "@/types/academics/marksheet-summary";
import { AlertCircle, Award, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

type SemesterRowProps = {
  semester: MarksheetSummary;
  onBacklogsClick: (failedSubjects: SubjectMetadataType[]) => void;
};

export default function SemesterRow({
  semester,
  onBacklogsClick,
}: SemesterRowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-3 py-3 text-sm font-medium">{semester.semester}</td>
      <td className="px-3 py-3 text-sm text-gray-600">{semester.year1}</td>
      <td className="px-3 py-3 text-sm">
        <div className="flex items-center gap-1.5">
          {semester.result === "PASSED" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 font-medium">PASSED</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">FAILED</span>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        {semester.failedSubjects && semester.failedSubjects.length > 0 ? (
          <button
            onClick={() => onBacklogsClick(semester.failedSubjects)}
            className="flex items-center gap-1.5 bg-red-100 text-red-700 rounded-md px-2 py-1 text-xs font-medium hover:bg-red-200 transition-colors"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {semester.failedSubjects.length}{" "}
            {semester.failedSubjects.length === 1 ? "subject" : "subjects"}
          </button>
        ) : (
          <span className="text-emerald-600 font-medium text-xs">None</span>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        {semester.result === "PASSED" && semester.sgpa !== null ? (
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{semester.sgpa}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}
