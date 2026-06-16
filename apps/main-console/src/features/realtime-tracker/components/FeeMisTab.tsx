import { useMemo } from "react";
import type { FeeMisCourseRow, FeeMisPayload } from "../types/realtime-tracker-types";
import { formatInr } from "@/features/fees-dashboard/data/dashboard-metrics";
import {
  buildFeeMisTableBlocks,
  streamFeeRowSpans,
  streamSemesterLabels,
  type FeeMisStreamSegment,
} from "./fee-mis-layout";
import { cn } from "@/lib/utils";

const th =
  "border border-neutral-300 bg-neutral-100 px-2.5 py-2 text-center text-sm font-bold leading-snug text-neutral-800";
const td = "border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900";
const tdNum = `${td} text-right tabular-nums`;
const tdCenter = `${td} text-center`;
const tdMuted = `${tdCenter} bg-slate-50 text-xs font-semibold uppercase tracking-wide text-neutral-500`;
const tdBold =
  "border border-neutral-300 bg-neutral-50 px-2.5 py-2 text-sm font-semibold text-neutral-900";

function fmtAmt(n: number | undefined): string {
  return formatInr(n ?? 0);
}

function fmtNos(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-IN");
}

function SemesterCellLabels({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
      {labels.map((label, i) => (
        <span key={`${label}-${i}`} className="block text-center text-sm leading-snug">
          {label}
        </span>
      ))}
    </div>
  );
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
      <div className="mx-auto w-full min-w-[920px] max-w-[1280px]">
        <table className="w-full border-collapse border border-neutral-300 text-sm shadow-sm">
          <thead>
            <tr>
              <th className={cn(th, "w-10")}>#</th>
              <th className={cn(th, "text-left")}>Course Name</th>
              <th className={th}>Total Number</th>
              <th className={th}>Not Paid</th>
              <th className={th}>Semester</th>
              <th className={cn(th, "w-12")} />
              <th className={th}>Total Fee Receivable</th>
              <th className={th}>Fee Collected</th>
              <th className={th}>Fee Pending</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) =>
              block.kind === "stream" ? (
                <StreamSegmentRows
                  key={`stream-${block.segment.id}`}
                  segment={block.segment}
                  semesterDisplayLabels={data.semesterDisplayLabels ?? []}
                />
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

function StreamSegmentRows({
  segment,
  semesterDisplayLabels = [],
}: {
  segment: FeeMisStreamSegment;
  semesterDisplayLabels?: string[];
}) {
  const fee = segment.totalRow;
  const semesterLabels = streamSemesterLabels(segment, semesterDisplayLabels);
  const programs = segment.detailRows;
  const n = programs.length;

  if (n === 0) {
    return <SummaryRows course={fee} showIndex={false} />;
  }

  const { blockRows, amtRowSpan, nosRowSpan } = streamFeeRowSpans(n);
  const bodyRows = [
    ...programs.map((course) => ({ kind: "program" as const, course })),
    { kind: "total" as const, course: fee },
  ];

  return (
    <>
      {bodyRows.map((row, i) => {
        const isProgram = row.kind === "program";
        const course = row.course;
        const showSemester = i === 0;
        const showAmt = i === 0;
        const showNos = i === amtRowSpan;
        const rowBg = isProgram ? "" : tdBold;

        return (
          <tr key={`${segment.id}-${row.kind}-${i}`}>
            <td className={cn(isProgram ? tdCenter : tdBold, "tabular-nums text-center")}>
              {isProgram ? course.index : ""}
            </td>
            <td className={cn(isProgram ? td : tdBold, "text-left")}>{course.courseName}</td>
            <td className={cn(tdNum, rowBg)}>{course.totalStudents.toLocaleString("en-IN")}</td>
            <td className={cn(tdNum, "text-red-700", rowBg)}>
              {course.notPaid.toLocaleString("en-IN")}
            </td>
            {showSemester ? (
              <td className={cn(tdCenter, "align-middle")} rowSpan={blockRows}>
                <SemesterCellLabels labels={semesterLabels} />
              </td>
            ) : null}
            {showAmt ? (
              <>
                <td className={cn(tdMuted, "align-middle")} rowSpan={amtRowSpan}>
                  AMT
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={amtRowSpan}>
                  {fmtAmt(fee.receivableAmt)}
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={amtRowSpan}>
                  {fmtAmt(fee.collectedAmt)}
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={amtRowSpan}>
                  {fmtAmt(fee.pendingAmt)}
                </td>
              </>
            ) : null}
            {showNos ? (
              <>
                <td className={cn(tdMuted, "align-middle")} rowSpan={nosRowSpan}>
                  NOS
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={nosRowSpan}>
                  {fmtNos(fee.receivableNos)}
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={nosRowSpan}>
                  {fmtNos(fee.collectedNos)}
                </td>
                <td className={cn(tdNum, "align-middle")} rowSpan={nosRowSpan}>
                  {fmtNos(fee.pendingNos)}
                </td>
              </>
            ) : null}
          </tr>
        );
      })}
    </>
  );
}

function SummaryRows({
  course,
  showIndex = true,
}: {
  course: FeeMisCourseRow;
  showIndex?: boolean;
}) {
  const bg = tdBold;
  const { amtRowSpan, nosRowSpan } = streamFeeRowSpans(0);

  return (
    <>
      <tr>
        <td className={cn(bg, "text-center")}>{showIndex ? "" : ""}</td>
        <td className={cn(bg, "text-left")}>{course.courseName}</td>
        <td className={cn(bg, "text-right tabular-nums")}>
          {course.totalStudents.toLocaleString("en-IN")}
        </td>
        <td className={cn(bg, "text-right tabular-nums text-red-700")}>
          {course.notPaid.toLocaleString("en-IN")}
        </td>
        <td className={cn(bg, "align-middle")} rowSpan={amtRowSpan + nosRowSpan} />
        <td className={cn(tdMuted, bg, "align-middle")} rowSpan={amtRowSpan}>
          AMT
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={amtRowSpan}>
          {fmtAmt(course.receivableAmt)}
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={amtRowSpan}>
          {fmtAmt(course.collectedAmt)}
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={amtRowSpan}>
          {fmtAmt(course.pendingAmt)}
        </td>
      </tr>
      <tr>
        <td className={bg} colSpan={4} />
        <td className={cn(tdMuted, bg, "align-middle")} rowSpan={nosRowSpan}>
          NOS
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={nosRowSpan}>
          {fmtNos(course.receivableNos)}
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={nosRowSpan}>
          {fmtNos(course.collectedNos)}
        </td>
        <td className={cn(bg, "text-right tabular-nums align-middle")} rowSpan={nosRowSpan}>
          {fmtNos(course.pendingNos)}
        </td>
      </tr>
    </>
  );
}
