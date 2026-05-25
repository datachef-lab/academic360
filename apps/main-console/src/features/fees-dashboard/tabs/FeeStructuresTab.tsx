import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabPanel } from "../components/TabPanel";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { CompactPanel } from "../components/CompactPanel";
import { SemesterFeePaymentPanel } from "../components/SemesterFeePaymentPanel";
import { DomainCallout } from "../components/DomainCallout";
import { StructureSlabChartWidget } from "../components/widgets/StructureSlabChartWidget";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import {
  getStructurePaymentWindowStatus,
  isStructureOnlineWindowOpen,
} from "../hooks/useFeesDashboardData";
import { flattenStructuresBySlab } from "../utils/structure-display";
import { formatInr } from "../data/dashboard-metrics";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../components/FeesTable";

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-amber-100 text-amber-800",
  closed: "bg-slate-100 text-slate-600",
  no_rule: "bg-orange-100 text-orange-800",
};

export function FeeStructuresTab() {
  const { structures, semesterFeeActivities, loading, error } = useFeesDashboard();
  const tableRows = flattenStructuresBySlab(structures);

  return (
    <TabPanel tab="structures">
      <DomainCallout title="Fee structures & student payment">
        <p>
          Each <strong>fee_structure</strong> defines heads and slab amounts. Amount is the sum of
          components for that <strong>fee slab</strong> only. Online window and Semester Fee Payment
          scopes control portal access.
        </p>
      </DomainCallout>

      {error && <p className="text-sm text-red-600">{error} Showing cached or sample metrics.</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="structures" />
        <StructureSlabChartWidget />
      </div>

      <SemesterFeePaymentPanel />

      <CompactPanel
        title="Fee structures · by slab"
        headerRight={
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link to="/dashboard/fees/structure">Manage →</Link>
          </Button>
        }
        noPadding
      >
        {loading ? (
          <p className="p-4 text-sm text-[#1a1a1a]">Loading structures…</p>
        ) : (
          <div className="max-h-[min(520px,60vh)] overflow-auto">
            <FeesTable>
              <FeesTableHeader>
                <FeesTableHead>Receipt / structure</FeesTableHead>
                <FeesTableHead>Program · class</FeesTableHead>
                <FeesTableHead>Shift</FeesTableHead>
                <FeesTableHead>Fee slab</FeesTableHead>
                <FeesTableHead className="text-right">Amount</FeesTableHead>
                <FeesTableHead>Online window</FeesTableHead>
                <FeesTableHead>Payment service</FeesTableHead>
              </FeesTableHeader>
              <FeesTableBody>
                {tableRows.length === 0 ? (
                  <FeesTableRow>
                    <FeesTableCell colSpan={7} className="text-center">
                      No fee structures
                    </FeesTableCell>
                  </FeesTableRow>
                ) : (
                  tableRows.map(({ structure: s, slab }) => {
                    const paymentStatus = getStructurePaymentWindowStatus(s, semesterFeeActivities);
                    const onlineOpen = isStructureOnlineWindowOpen(s);
                    const rowKey = `${s.id}-${slab?.slabKey ?? "none"}`;

                    return (
                      <FeesTableRow key={rowKey}>
                        <FeesTableCell>
                          <p className="font-medium">
                            {s.receiptType?.name ?? `Structure #${s.id}`}
                          </p>
                          <p className="text-xs">{s.academicYear?.year ?? "—"}</p>
                        </FeesTableCell>
                        <FeesTableCell>
                          <p>{s.programCourse?.name ?? s.programCourse?.shortName ?? "—"}</p>
                          <p className="text-xs">{s.class?.name ?? "—"}</p>
                        </FeesTableCell>
                        <FeesTableCell className="text-xs">{s.shift?.name ?? "—"}</FeesTableCell>
                        <FeesTableCell className="text-xs font-medium">
                          {slab?.slabLabel ?? "—"}
                        </FeesTableCell>
                        <FeesTableCell className="text-right font-semibold tabular-nums">
                          {slab ? formatInr(slab.amount) : "—"}
                        </FeesTableCell>
                        <FeesTableCell className="text-xs">
                          <Badge
                            className={
                              onlineOpen ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
                            }
                          >
                            {onlineOpen ? "Open" : "Closed"}
                          </Badge>
                          <span className="mt-1 block">
                            {formatDate(s.onlineStartDate ?? s.startDate)} –{" "}
                            {formatDate(s.onlineEndDate ?? s.endDate)}
                          </span>
                        </FeesTableCell>
                        <FeesTableCell>
                          <Badge className={PAYMENT_STATUS_STYLE[paymentStatus]}>
                            {paymentStatus === "no_rule"
                              ? "No scope"
                              : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                          </Badge>
                        </FeesTableCell>
                      </FeesTableRow>
                    );
                  })
                )}
              </FeesTableBody>
            </FeesTable>
          </div>
        )}
      </CompactPanel>
    </TabPanel>
  );
}
