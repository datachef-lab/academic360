import { CompactPanel } from "./CompactPanel";
import { buildProgramEnrollmentMatrix, ENROLLMENT_SEMESTERS } from "../data/enrollment-matrix";
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

export function EnrollmentProgramMatrix() {
  const rows = buildProgramEnrollmentMatrix();

  const semTotals = ENROLLMENT_SEMESTERS.map((sem) => {
    let paid = 0;
    let notPaid = 0;
    let challanGenerated = 0;
    rows.forEach((r) => {
      const c = r.bySemester[sem];
      if (c) {
        paid += c.paid;
        notPaid += c.notPaid;
        challanGenerated += c.challanGenerated;
      }
    });
    return { sem, paid, notPaid, challanGenerated };
  });

  return (
    <CompactPanel title="Program × semester (paid / not paid / challan generated)" noPadding>
      <FeesTable>
        <FeesTableHeader multiRow>
          <FeesTableHeaderRow>
            <FeesTableHead rowSpan={2} className="w-[22%] align-bottom">
              Program
            </FeesTableHead>
            {ENROLLMENT_SEMESTERS.map((sem) => (
              <FeesTableHead key={sem} colSpan={3} className="border-b-0 text-center">
                {sem}
              </FeesTableHead>
            ))}
          </FeesTableHeaderRow>
          <FeesTableHeaderRow>
            {ENROLLMENT_SEMESTERS.flatMap((sem) => [
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
          {rows.map((row) => (
            <FeesTableRow key={row.program}>
              <FeesTableCell className="font-semibold">{row.program}</FeesTableCell>
              {ENROLLMENT_SEMESTERS.flatMap((sem) => {
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
                    key={`${row.program}-${sem}-c`}
                    className="text-center tabular-nums"
                  >
                    {formatCount(cell?.challanGenerated)}
                  </FeesTableCell>,
                ];
              })}
            </FeesTableRow>
          ))}
          <FeesTableRow highlight>
            <FeesTableCell className="font-semibold">Total</FeesTableCell>
            {ENROLLMENT_SEMESTERS.flatMap((sem) => {
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
                  key={`t-${sem}-c`}
                  className="text-center font-semibold tabular-nums"
                >
                  {t.challanGenerated.toLocaleString("en-IN")}
                </FeesTableCell>,
              ];
            })}
          </FeesTableRow>
        </FeesTableBody>
      </FeesTable>
    </CompactPanel>
  );
}
