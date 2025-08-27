import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GraduationCap } from "lucide-react";
import {
  MarksheetSummary,
  SubjectMetadataType,
} from "@/types/academics/marksheet-summary";
import { SemesterSummaryTable } from "./SemesterSummaryTable";
import { getSemesterSummary } from "@/lib/services/semester-summary.service";
import { Student } from "@/types/academics/student";
import BacklogDialog from "./BacklogDialog";

export default function SemesterSummary({ student }: { student: Student }) {
  const [semesterSummary, setSemesterSummary] = useState<
    MarksheetSummary[] | null
  >(null);
  const [selectedBacklogs, setSelectedBacklogs] = useState<
    SubjectMetadataType[] | null
  >(null);
  const [backlogsDialogOpen, setBacklogsDialogOpen] = useState(false);

  useEffect(() => {
    if (!semesterSummary) {
      getSemesterSummary(student!.codeNumber).then((summary) => {
        if (summary) {
          console.log("summary:", summary);
          setSemesterSummary(summary);
        } else {
          console.error("Failed to fetch semester summary");
        }
      });
    }
  }, [student]);

  const handleBacklogsClick = (failedSubjects: SubjectMetadataType[]) => {
    if (failedSubjects && failedSubjects.length > 0) {
      setSelectedBacklogs(failedSubjects);
      setBacklogsDialogOpen(true);
    }
  };

  return (
    <>
      {/* Semester Summary Card */}
      <Card className="border-0 shadow-md rounded-2xl overflow-hidden my-5 bg-white">
        <CardHeader className="pb-2 pt-3 px-5">
          <CardTitle className="text-base font-semibold text-black flex items-center">
            <GraduationCap className="w-4 h-4 mr-2 text-[#925FE2]" />
            Semester Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-3 pt-0">
          {semesterSummary && semesterSummary.length > 0 ? (
            <SemesterSummaryTable
              data={semesterSummary}
              onBacklogsClick={handleBacklogsClick}
            />
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No semester data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backlogs Dialog */}
      <BacklogDialog
        open={backlogsDialogOpen}
        setOpen={setBacklogsDialogOpen}
        backlogs={selectedBacklogs}
      />
    </>
  );
}
