import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { VisualCard } from "./VisualCard";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "./FeesTable";

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function scopeStatus(
  isEnabled: boolean,
  startDate?: string | Date | null,
  endDate?: string | Date | null,
): { label: string; className: string } {
  if (!isEnabled) return { label: "Disabled", className: "bg-slate-100 text-slate-700" };
  const now = Date.now();
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Infinity;
  if (now < start) return { label: "Scheduled", className: "bg-amber-100 text-amber-800" };
  if (now > end) return { label: "Closed", className: "bg-slate-100 text-slate-600" };
  return { label: "Open", className: "bg-emerald-100 text-emerald-800" };
}

export function SemesterFeePaymentPanel() {
  const { semesterFeeActivities, loading } = useFeesDashboard();

  const rows = semesterFeeActivities.flatMap((activity) =>
    (activity.scopes || []).map((scope) => ({
      key: `${activity.id}-${scope.id}`,
      ay: activity.academicYear?.year ?? "—",
      stream: scope.stream?.name ?? "—",
      className: scope.class?.name ?? "—",
      start: scope.startDate,
      end: scope.endDate,
      isEnabled: scope.isEnabled,
    })),
  );

  return (
    <VisualCard
      title="Semester fee payment rule"
      headerRight={
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/dashboard/academic-activity">Configure →</Link>
        </Button>
      }
      noPadding
    >
      <p className="border-b border-[#ebebeb] bg-[#faf5ff] px-4 py-2 text-xs text-[#555]">
        Student portal fee cards are shown only when an enabled scope matches promotion class,
        stream, and dates. This is separate from{" "}
        <code className="rounded bg-white px-1">fee_structures.onlineStartDate</code>.
      </p>
      {loading ? (
        <p className="p-4 text-sm text-[#888]">Loading academic activities…</p>
      ) : rows.length === 0 ? (
        <p className="p-4 text-sm text-[#888]">
          No &quot;Semester Fee Payment&quot; activity configured. Add one under Academic Activity.
        </p>
      ) : (
        <div className="p-3">
          <div className="overflow-hidden rounded-md border border-[#a0a0a0] bg-white">
            <FeesTable>
              <FeesTableHeader>
                <FeesTableHead>Academic year</FeesTableHead>
                <FeesTableHead>Stream</FeesTableHead>
                <FeesTableHead>Class / semester</FeesTableHead>
                <FeesTableHead>Window</FeesTableHead>
                <FeesTableHead>Status</FeesTableHead>
              </FeesTableHeader>
              <FeesTableBody>
                {rows.map((row) => {
                  const st = scopeStatus(Boolean(row.isEnabled), row.start, row.end);
                  return (
                    <FeesTableRow key={row.key}>
                      <FeesTableCell>{row.ay}</FeesTableCell>
                      <FeesTableCell>{row.stream}</FeesTableCell>
                      <FeesTableCell>{row.className}</FeesTableCell>
                      <FeesTableCell className="text-xs text-[#666]">
                        {formatDate(row.start)} – {formatDate(row.end)}
                      </FeesTableCell>
                      <FeesTableCell>
                        <Badge className={st.className}>{st.label}</Badge>
                      </FeesTableCell>
                    </FeesTableRow>
                  );
                })}
              </FeesTableBody>
            </FeesTable>
          </div>
        </div>
      )}
    </VisualCard>
  );
}
