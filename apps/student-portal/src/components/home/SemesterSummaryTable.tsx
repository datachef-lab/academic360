import {
  MarksheetSummary,
  SubjectMetadataType,
} from "@/types/academics/marksheet-summary";
import SemesterRow from "./SemesterRow";

type SemesterSummaryTableProps = {
  data: MarksheetSummary[];
  onBacklogsClick: (failedSubjects: SubjectMetadataType[]) => void;
};

export const SemesterSummaryTable = ({
  data,
  onBacklogsClick,
}: SemesterSummaryTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="bg-gray-50 text-left">
            {["Semester", "Year", "Status", "Backlogs", "SGPA"].map(
              (header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-sm font-medium text-gray-600"
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((semester) => (
            <SemesterRow
              key={semester.id}
              semester={semester}
              onBacklogsClick={onBacklogsClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
