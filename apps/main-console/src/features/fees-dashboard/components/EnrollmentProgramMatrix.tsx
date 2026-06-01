import { useMemo } from "react";
import { CompactPanel } from "./CompactPanel";
import { SemesterClassLabel } from "./SemesterClassLabel";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import type { EnrollmentMatrixRow } from "../types/dashboard-api";
import { DashboardEmptyState } from "./DashboardEmptyState";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableHeaderRow,
  FeesTableRow,
} from "./FeesTable";

function formatCount(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString("en-IN");
}

function deriveSemesters(rows: EnrollmentMatrixRow[]): string[] {
  const semSet = new Set<string>();
  rows.forEach((r) => {
    Object.keys(r.bySemester).forEach((sem) => semSet.add(sem));
  });
  return [...semSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function EnrollmentProgramMatrix() {
  const { dashboard, dashboardLoading } = useFeesDashboard();

  const { rows, semesters } = useMemo(() => {
    const apiRows = dashboard?.enrollmentMatrix ?? [];
    return {
      rows: apiRows,
      semesters: deriveSemesters(apiRows),
    };
  }, [dashboard?.enrollmentMatrix]);

  const semTotals = semesters.map((sem) => {
    let paid = 0;
    let notPaid = 0;
    let eligible = 0;
    rows.forEach((r) => {
      const c = r.bySemester[sem];
      if (c) {
        paid += c.paid;
        notPaid += c.notPaid;
        eligible += c.eligible;
      }
    });
    return { sem, paid, notPaid, eligible };
  });

  return (
    <CompactPanel title="Program course × semester (paid / due / eligible students)" noPadding>
      {rows.length === 0 && !dashboardLoading ? (
        <DashboardEmptyState message="No enrollment fee mappings found." />
      ) : (
        <FeesTable>
          <FeesTableHeader multiRow>
            <FeesTableHeaderRow>
              <FeesTableHead rowSpan={2} className="w-[22%] align-bottom">
                Program course
              </FeesTableHead>
              {semesters.map((sem) => (
                <FeesTableHead key={sem} colSpan={3} className="border-b-0 text-center">
                  <SemesterClassLabel name={sem} className="justify-center" numeralOnly />
                </FeesTableHead>
              ))}
            </FeesTableHeaderRow>
            <FeesTableHeaderRow>
              {semesters.flatMap((sem) => [
                <FeesTableHead key={`${sem}-p`} className="text-center">
                  Paid
                </FeesTableHead>,
                <FeesTableHead key={`${sem}-u`} className="text-center">
                  Due
                </FeesTableHead>,
                <FeesTableHead key={`${sem}-e`} className="text-center">
                  Eligible
                </FeesTableHead>,
              ])}
            </FeesTableHeaderRow>
          </FeesTableHeader>
          <FeesTableBody>
            {rows.map((row) => (
              <FeesTableRow key={row.program}>
                <FeesTableCell className="font-semibold">{row.program}</FeesTableCell>
                {semesters.flatMap((sem) => {
                  const cell = row.bySemester[sem];
                  return [
                    <FeesTableCell
                      key={`${row.program}-${sem}-p`}
                      className="text-center tabular-nums"
                    >
                      {formatCount(cell?.paid)}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`${row.program}-${sem}-u`}
                      className="text-center tabular-nums"
                    >
                      {formatCount(cell?.notPaid)}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`${row.program}-${sem}-e`}
                      className="text-center tabular-nums"
                    >
                      {formatCount(cell?.eligible)}
                    </FeesTableCell>,
                  ];
                })}
              </FeesTableRow>
            ))}
            {rows.length > 0 && (
              <FeesTableRow highlight>
                <FeesTableCell className="font-semibold">Total</FeesTableCell>
                {semesters.flatMap((sem) => {
                  const t = semTotals.find((x) => x.sem === sem)!;
                  return [
                    <FeesTableCell
                      key={`t-${sem}-p`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {t.paid.toLocaleString("en-IN")}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`t-${sem}-u`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {t.notPaid.toLocaleString("en-IN")}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`t-${sem}-e`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {t.eligible.toLocaleString("en-IN")}
                    </FeesTableCell>,
                  ];
                })}
              </FeesTableRow>
            )}
          </FeesTableBody>
        </FeesTable>
      )}
    </CompactPanel>
  );
}
