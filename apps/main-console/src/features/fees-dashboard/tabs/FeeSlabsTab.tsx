import { useMemo } from "react";
import { TabPanel } from "../components/TabPanel";
import { CompactPanel } from "../components/CompactPanel";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableHeaderRow,
  FeesTableRow,
} from "../components/FeesTable";

function formatCount(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString("en-IN");
}

function deriveSemesters(rows: { semester: string }[]): string[] {
  const semSet = new Set(rows.map((r) => r.semester));
  return [...semSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function deriveSlabs(rows: { slabName: string }[]): string[] {
  const slabSet = new Set(rows.map((r) => r.slabName));
  return [...slabSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function FeeSlabsTab() {
  const { dashboard, dashboardLoading, metrics } = useFeesDashboard();
  const rows = dashboard?.slabBreakdown ?? [];

  const { slabs, semesters } = useMemo(
    () => ({
      slabs: deriveSlabs(rows),
      semesters: deriveSemesters(rows),
    }),
    [rows],
  );

  const semPaidTotals = semesters.map((sem) =>
    rows.filter((r) => r.semester === sem).reduce((s, r) => s + r.fullyPaid, 0),
  );
  const semDueTotals = semesters.map((sem) =>
    rows.filter((r) => r.semester === sem).reduce((s, r) => s + r.partialUnpaid, 0),
  );
  const semChallanTotals = semesters.map((sem) =>
    rows.filter((r) => r.semester === sem).reduce((s, r) => s + r.challanGenerated, 0),
  );
  const grandEligible = metrics.eligible_students;

  return (
    <TabPanel tab="slabs">
      <CompactPanel title="Students by fee slab · semester (paid / not paid)" noPadding>
        {rows.length === 0 && !dashboardLoading ? (
          <DashboardEmptyState message="No fee slab mappings for active students in this scope." />
        ) : (
          <FeesTable>
            <FeesTableHeader multiRow>
              <FeesTableHeaderRow>
                <FeesTableHead rowSpan={2} className="w-[12%] align-bottom">
                  Fee slab
                </FeesTableHead>
                {semesters.map((sem) => (
                  <FeesTableHead key={sem} colSpan={3} className="border-b-0 text-center">
                    {sem}
                  </FeesTableHead>
                ))}
                <FeesTableHead rowSpan={2} className="w-[10%] text-right align-bottom">
                  Total eligible
                </FeesTableHead>
              </FeesTableHeaderRow>
              <FeesTableHeaderRow>
                {semesters.flatMap((sem) => [
                  <FeesTableHead key={`${sem}-p`} className="text-center">
                    Paid
                  </FeesTableHead>,
                  <FeesTableHead key={`${sem}-u`} className="text-center">
                    Due
                  </FeesTableHead>,
                  <FeesTableHead key={`${sem}-c`} className="text-center">
                    Challan gen.
                  </FeesTableHead>,
                ])}
              </FeesTableHeaderRow>
            </FeesTableHeader>
            <FeesTableBody>
              {slabs.map((slabName) => {
                const slabRows = rows.filter((r) => r.slabName === slabName);
                const totalEligible = slabRows.reduce((s, r) => s + r.eligible, 0);
                return (
                  <FeesTableRow key={slabName}>
                    <FeesTableCell className="font-semibold">{slabName}</FeesTableCell>
                    {semesters.flatMap((sem) => {
                      const cell = slabRows.find((r) => r.semester === sem);
                      return [
                        <FeesTableCell
                          key={`${slabName}-${sem}-p`}
                          className="text-center tabular-nums"
                        >
                          {formatCount(cell?.fullyPaid)}
                        </FeesTableCell>,
                        <FeesTableCell
                          key={`${slabName}-${sem}-u`}
                          className="text-center tabular-nums"
                        >
                          {formatCount(cell?.partialUnpaid)}
                        </FeesTableCell>,
                        <FeesTableCell
                          key={`${slabName}-${sem}-c`}
                          className="text-center tabular-nums"
                        >
                          {formatCount(cell?.challanGenerated)}
                        </FeesTableCell>,
                      ];
                    })}
                    <FeesTableCell className="text-right font-semibold tabular-nums">
                      {totalEligible.toLocaleString("en-IN")}
                    </FeesTableCell>
                  </FeesTableRow>
                );
              })}
              {slabs.length > 0 && (
                <FeesTableRow highlight>
                  <FeesTableCell className="font-semibold">Total</FeesTableCell>
                  {semesters.flatMap((sem, i) => [
                    <FeesTableCell
                      key={`t-${sem}-p`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {(semPaidTotals[i] ?? 0).toLocaleString("en-IN")}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`t-${sem}-u`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {(semDueTotals[i] ?? 0).toLocaleString("en-IN")}
                    </FeesTableCell>,
                    <FeesTableCell
                      key={`t-${sem}-c`}
                      className="text-center font-semibold tabular-nums"
                    >
                      {(semChallanTotals[i] ?? 0).toLocaleString("en-IN")}
                    </FeesTableCell>,
                  ])}
                  <FeesTableCell className="text-right font-semibold tabular-nums">
                    {grandEligible.toLocaleString("en-IN")}
                  </FeesTableCell>
                </FeesTableRow>
              )}
            </FeesTableBody>
          </FeesTable>
        )}
      </CompactPanel>
    </TabPanel>
  );
}
