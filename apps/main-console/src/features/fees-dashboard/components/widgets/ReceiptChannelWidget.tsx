import { useMemo } from "react";
import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";
import { donutColor, formatPaymentChannel } from "../../utils/dashboard-display";

export function ReceiptChannelWidget() {
  const { dashboard, dashboardLoading } = useFeesDashboard();

  const { data, footerRows } = useMemo(() => {
    const rows = (dashboard?.paymentChannels ?? []).map((c) => ({
      channel: formatPaymentChannel(c.channel),
      studentCount: c.studentCount,
      amount: c.amount,
    }));
    return {
      data: rows.map((c, i) => ({
        name: c.channel,
        value: c.studentCount,
        color: donutColor(i),
      })),
      footerRows: rows,
    };
  }, [dashboard?.paymentChannels]);

  if (footerRows.length === 0 && !dashboardLoading) {
    return (
      <VisualCard title="Receipts by channel">
        <DashboardEmptyState message="No receipt channel data found." />
      </VisualCard>
    );
  }

  return (
    <VisualCard title="Receipts by channel">
      <ChartDonut
        data={data}
        centerLabel={<span className="text-xs font-semibold text-[#1a1a1a]">Students</span>}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {footerRows.map((c, i) => (
              <li key={c.channel} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: donutColor(i) }} />
                  {c.channel}
                </span>
                <strong className="tabular-nums">{formatInr(c.amount)}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
