import { CompactPanel } from "../CompactPanel";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../FeesTable";
import { formatInr } from "../../data/dashboard-metrics";

const ROWS = [
  {
    programCourse: "B.Com (H) · Commerce",
    semester: "Sem IV",
    session: "2025-26",
    eligible: 798,
    demand: 98_200_000,
    collected: 75_400_000,
  },
  {
    programCourse: "BBA (H) · Management",
    semester: "Sem VI",
    session: "2025-26",
    eligible: 548,
    demand: 86_000_000,
    collected: 55_200_000,
  },
  {
    programCourse: "BCA · Computer Applications",
    semester: "Sem I",
    session: "2025-26",
    eligible: 445,
    demand: 62_100_000,
    collected: 60_000_000,
  },
  {
    programCourse: "M.Com · Commerce",
    semester: "Sem II",
    session: "2025-26",
    eligible: 220,
    demand: 48_500_000,
    collected: 37_100_000,
  },
];

export function PromotionFeeWidget() {
  return (
    <CompactPanel title="By promotion (program · semester · session)" noPadding>
      <FeesTable>
        <FeesTableHeader>
          <FeesTableHead>Program · course</FeesTableHead>
          <FeesTableHead>Class</FeesTableHead>
          <FeesTableHead>Session</FeesTableHead>
          <FeesTableHead className="text-right">Eligible</FeesTableHead>
          <FeesTableHead className="text-right">Receivable</FeesTableHead>
          <FeesTableHead className="text-right">Collected</FeesTableHead>
          <FeesTableHead className="text-right">%</FeesTableHead>
        </FeesTableHeader>
        <FeesTableBody>
          {ROWS.map((r) => {
            const pct = Math.round((r.collected / r.demand) * 100);
            return (
              <FeesTableRow key={`${r.programCourse}-${r.semester}`}>
                <FeesTableCell className="font-medium">{r.programCourse}</FeesTableCell>
                <FeesTableCell>{r.semester}</FeesTableCell>
                <FeesTableCell>{r.session}</FeesTableCell>
                <FeesTableCell className="text-right tabular-nums">
                  {r.eligible.toLocaleString("en-IN")}
                </FeesTableCell>
                <FeesTableCell className="text-right tabular-nums">
                  {formatInr(r.demand)}
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
    </CompactPanel>
  );
}
