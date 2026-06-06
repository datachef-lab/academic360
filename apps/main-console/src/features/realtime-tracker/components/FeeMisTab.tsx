import { useMemo } from "react";
import type { FeeMisCourseRow, FeeMisPayload } from "../types/realtime-tracker-types";
import { buildFeeMisTableBlocks, type FeeMisStreamSegment } from "./fee-mis-layout";
import { cn } from "@/lib/utils";

const th =
  "border border-neutral-300 bg-neutral-100 px-2.5 py-2 text-center text-sm font-bold leading-snug text-neutral-800";
const td = "border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900";
const tdNum = `${td} text-right tabular-nums`;
const tdCenter = `${td} text-center`;
const tdBold =
  "border border-neutral-300 bg-neutral-50 px-2.5 py-2 text-sm font-semibold text-neutral-900";

function paidStudents(course: FeeMisCourseRow): number {
  return Math.max(0, course.totalStudents - course.notPaid);
}

type Props = {
  data: FeeMisPayload | null;
  isLoading?: boolean;
};

export function FeeMisTab({ data, isLoading }: Props) {
  const blocks = useMemo(() => buildFeeMisTableBlocks(data?.courseRows ?? []), [data?.courseRows]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white text-base text-neutral-500">
        Loading fee MIS…
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-white p-3 sm:p-4">
      <div className="mx-auto w-full min-w-[640px] max-w-[960px]">
        <table className="w-full border-collapse border border-neutral-300 text-sm shadow-sm">
          <thead>
            <tr>
              <th className={cn(th, "w-10")}>#</th>
              <th className={cn(th, "text-left")}>Program Course</th>
              <th className={th}>Total Number</th>
              <th className={th}>Paid</th>
              <th className={th}>Not Paid</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) =>
              block.kind === "stream" ? (
                <StreamSegmentRows key={`stream-${block.segment.id}`} segment={block.segment} />
              ) : (
                <SummaryRows
                  key={`summary-${block.summary.course.courseName}`}
                  course={block.summary.course}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentCountCells({ course, rowBg = "" }: { course: FeeMisCourseRow; rowBg?: string }) {
  return (
    <>
      <td className={cn(tdNum, rowBg)}>{course.totalStudents.toLocaleString("en-IN")}</td>
      <td className={cn(tdNum, "text-emerald-700", rowBg)}>
        {paidStudents(course).toLocaleString("en-IN")}
      </td>
      <td className={cn(tdNum, "text-red-700", rowBg)}>{course.notPaid.toLocaleString("en-IN")}</td>
    </>
  );
}

function StreamSegmentRows({ segment }: { segment: FeeMisStreamSegment }) {
  const fee = segment.totalRow;
  const programs = segment.detailRows;

  if (programs.length === 0) {
    return <SummaryRows course={fee} />;
  }

  const bodyRows = [
    ...programs.map((course) => ({ kind: "program" as const, course })),
    { kind: "total" as const, course: fee },
  ];

  return (
    <>
      {bodyRows.map((row, i) => {
        const isProgram = row.kind === "program";
        const course = row.course;
        const rowBg = isProgram ? "" : tdBold;

        return (
          <tr key={`${segment.id}-${row.kind}-${i}`}>
            <td className={cn(isProgram ? tdCenter : tdBold, "tabular-nums text-center")}>
              {isProgram ? course.index + "." : ""}
            </td>
            <td className={cn(isProgram ? td : tdBold, "text-left")}>{course.courseName}</td>
            <StudentCountCells course={course} rowBg={rowBg} />
          </tr>
        );
      })}
    </>
  );
}

function SummaryRows({ course }: { course: FeeMisCourseRow }) {
  const bg = tdBold;

  return (
    <tr>
      <td className={cn(bg, "text-center")} />
      <td className={cn(bg, "text-left")}>{course.courseName}</td>
      <StudentCountCells course={course} rowBg={bg} />
    </tr>
  );
}
