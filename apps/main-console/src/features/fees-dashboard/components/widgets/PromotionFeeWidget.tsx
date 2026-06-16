import { CompactPanel } from "../CompactPanel";
import { SemesterClassLabel } from "../SemesterClassLabel";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../FeesTable";
import { formatInr } from "../../data/dashboard-metrics";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";

export function PromotionFeeWidget() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const rows = dashboard?.promotionBreakdown ?? [];

  return (
    <CompactPanel title="By promotion (program · semester · session)" noPadding>
      {rows.length === 0 && !dashboardLoading ? (
        <DashboardEmptyState message="No promotion-level fee mappings found." />
      ) : (
        <FeesTable>
          <FeesTableHeader>
            <FeesTableHead>Program · course</FeesTableHead>
            <FeesTableHead>Semester</FeesTableHead>
            <FeesTableHead>Session</FeesTableHead>
            <FeesTableHead className="text-right">Eligible</FeesTableHead>
            <FeesTableHead className="text-right">Receivable</FeesTableHead>
            <FeesTableHead className="text-right">Collected</FeesTableHead>
            <FeesTableHead className="text-right">%</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {rows.map((r) => {
              const pct = r.receivable > 0 ? Math.round((r.collected / r.receivable) * 100) : 0;
              return (
                <FeesTableRow key={`${r.programCourse}-${r.semester}-${r.session}`}>
                  <FeesTableCell className="font-medium">{r.programCourse}</FeesTableCell>
                  <FeesTableCell>
                    <SemesterClassLabel name={r.semester} numeralOnly />
                  </FeesTableCell>
                  <FeesTableCell>{r.session}</FeesTableCell>
                  <FeesTableCell className="text-right tabular-nums">
                    {r.eligible.toLocaleString("en-IN")}
                  </FeesTableCell>
                  <FeesTableCell className="text-right tabular-nums">
                    {formatInr(r.receivable)}
                  </FeesTableCell>
                  <FeesTableCell className="text-right tabular-nums">
                    {formatInr(r.collected)}
                  </FeesTableCell>
                  <FeesTableCell className="text-right font-semibold">{pct}%</FeesTableCell>
                </FeesTableRow>
              );
            })}
          </FeesTableBody>
        </FeesTable>
      )}
    </CompactPanel>
  );
}
