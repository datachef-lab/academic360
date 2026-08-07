import { Loader2 } from "lucide-react";
import { DashboardPanel, GradientKpi, ProportionBar } from "../ui";
import { useDashboardFeeClearance } from "@/features/document-issuance/hooks/use-documents-dashboard";

/** 640000 -> "₹6.4L"; smaller amounts stay in plain Indian-grouped rupees. */
function formatLakhs(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function FeeClearanceBlocksTab() {
  const { data, isLoading, isError } = useDashboardFeeClearance();

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d4] bg-white text-[#666]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading fee-clearance blocks…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-[#d4d4d4] bg-white text-sm text-red-600">
        Failed to load fee-clearance blocks.
      </div>
    );
  }

  const { kpis, blockedStudents, blocksByDocType } = data;
  const maxBlocks = Math.max(1, ...blocksByDocType.map((b) => b.count));
  const avgOutstanding =
    kpis.studentsBlocked > 0 ? Math.round(kpis.totalOutstanding / kpis.studentsBlocked) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GradientKpi
          label="On-hold ledger rows"
          value={kpis.onHoldRows.toLocaleString()}
          hint="across fee-gated doc types"
          gradient="from-[#b91c1c] via-[#dc2626] to-[#ef4444]"
          icon="lock"
        />
        <GradientKpi
          label="Students blocked"
          value={kpis.studentsBlocked.toLocaleString()}
          hint="unique"
          gradient="from-[#b45309] via-[#d97706] to-[#f59e0b]"
          icon="users"
        />
        <GradientKpi
          label="Total outstanding"
          value={formatLakhs(kpis.totalOutstanding)}
          hint={`avg ${formatLakhs(avgOutstanding)}/student`}
          gradient="from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]"
          icon="rupee"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel
          title="Students with ON_HOLD documents"
          subtitle="Sorted by blocked doc count · click to open student ledger"
          headerRight={
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              {kpis.studentsBlocked} students · {kpis.onHoldRows} rows
            </span>
          }
          bodyClassName="p-0"
        >
          {blockedStudents.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-[#888]">
              No students are currently fee-blocked.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-[10px] uppercase tracking-wider text-[#999]">
                    <th className="px-4 py-2 font-medium">Student</th>
                    <th className="px-4 py-2 font-medium">Programme · sem</th>
                    <th className="px-4 py-2 text-center font-medium">Blocked</th>
                    <th className="px-4 py-2 text-right font-medium">Outstanding</th>
                    <th className="px-4 py-2 font-medium">Blocked doc types</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedStudents.map((s) => (
                    <tr
                      key={s.studentId}
                      className="cursor-pointer border-b border-[#ebebeb] last:border-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-[#1a1a1a]">{s.studentName}</p>
                        <p className="text-xs text-[#999]">{s.rollNumber ?? s.uid}</p>
                      </td>
                      <td className="px-4 py-2.5 text-[#555]">
                        {[s.programmeName, s.className].filter(Boolean).join(" · ")}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-semibold text-red-700">
                          {s.blockedCount}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                        ₹{s.outstanding.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#888]">
                        {s.blockedDocTypes.join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Blocks by document type" subtitle="Fee-gated types only">
          {blocksByDocType.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center text-sm text-[#888]">
              No blocks.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {blocksByDocType.map((b) => (
                <div key={b.documentTypeId} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-[#555]">{b.name}</span>
                  <ProportionBar value={b.count} max={maxBlocks} tone="red" />
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-[#1a1a1a]">
                    {b.count}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 border-t border-[#ebebeb] pt-3 text-[11px] leading-relaxed text-[#888]">
            Fee-clearance rule flips PENDING → ON_HOLD based on{" "}
            <code className="rounded bg-[#f2f2f2] px-1 py-0.5 text-[#555]">
              hasOutstandingFees(student)
            </code>
            . Payments unblock rows on the next passbook read (lazy) or immediately via payment
            write-hooks.
          </p>
        </DashboardPanel>
      </div>
    </div>
  );
}
