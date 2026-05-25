import { TabPanel } from "../components/TabPanel";
import { CompactPanel } from "../components/CompactPanel";
import { SLAB_BY_SEMESTER } from "../data/semester-breakdown";
import type { SemesterLabel } from "../data/semester-breakdown";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableHeaderRow,
  FeesTableRow,
} from "../components/FeesTable";

const SEMESTERS: SemesterLabel[] = ["Sem I", "Sem IV", "Sem VI"];

const SLABS = [...new Set(SLAB_BY_SEMESTER.map((r) => r.slabName))].sort();

function formatCount(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString("en-IN");
}

export function FeeSlabsTab() {
  const semPaidTotals = SEMESTERS.map((sem) =>
    SLAB_BY_SEMESTER.filter((r) => r.semester === sem).reduce((s, r) => s + r.fullyPaid, 0),
  );
  const semDueTotals = SEMESTERS.map((sem) =>
    SLAB_BY_SEMESTER.filter((r) => r.semester === sem).reduce((s, r) => s + r.partialUnpaid, 0),
  );
  const semChallanTotals = SEMESTERS.map((sem) =>
    SLAB_BY_SEMESTER.filter((r) => r.semester === sem).reduce((s, r) => s + r.challanGenerated, 0),
  );
  const grandEligible = SLAB_BY_SEMESTER.reduce((s, r) => s + r.eligible, 0);

  return (
    <TabPanel tab="slabs">
      <CompactPanel title="Students by fee slab · semester (paid / not paid)" noPadding>
        <FeesTable>
          <FeesTableHeader multiRow>
            <FeesTableHeaderRow>
              <FeesTableHead rowSpan={2} className="w-[12%] align-bottom">
                Fee slab
              </FeesTableHead>
              {SEMESTERS.map((sem) => (
                <FeesTableHead key={sem} colSpan={3} className="border-b-0 text-center">
                  {sem}
                </FeesTableHead>
              ))}
              <FeesTableHead rowSpan={2} className="w-[10%] text-right align-bottom">
                Total eligible
              </FeesTableHead>
            </FeesTableHeaderRow>
            <FeesTableHeaderRow>
              {SEMESTERS.flatMap((sem) => [
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
            {SLABS.map((slabName) => {
              const totalEligible = SLAB_BY_SEMESTER.filter((r) => r.slabName === slabName).reduce(
                (s, r) => s + r.eligible,
                0,
              );
              return (
                <FeesTableRow key={slabName}>
                  <FeesTableCell className="font-semibold">{slabName}</FeesTableCell>
                  {SEMESTERS.flatMap((sem) => {
                    const cell = SLAB_BY_SEMESTER.find(
                      (r) => r.slabName === slabName && r.semester === sem,
                    );
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
            <FeesTableRow highlight>
              <FeesTableCell className="font-semibold">Total</FeesTableCell>
              {SEMESTERS.flatMap((sem, i) => [
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
          </FeesTableBody>
        </FeesTable>
      </CompactPanel>
    </TabPanel>
  );
}
