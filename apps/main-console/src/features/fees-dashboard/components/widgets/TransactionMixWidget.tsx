import { useMemo } from "react";
import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";
import { donutColor } from "../../utils/dashboard-display";

export function TransactionMixWidget() {
  const { dashboard, dashboardLoading } = useFeesDashboard();

  const { data, totalCount, amounts } = useMemo(() => {
    const items = (dashboard?.transactionMix ?? []).map((row, i) => ({
      name: row.name,
      value: row.count,
      color: donutColor(i),
      amount: row.amount,
    }));
    return {
      data: items,
      totalCount: items.reduce((s, d) => s + d.value, 0),
      amounts: Object.fromEntries(items.map((d) => [d.name, d.amount])),
    };
  }, [dashboard?.transactionMix]);

  if (data.length === 0 && !dashboardLoading) {
    return (
      <VisualCard title="Transaction status">
        <DashboardEmptyState message="No fee transactions found." />
      </VisualCard>
    );
  }

  return (
    <VisualCard title="Transaction status">
      <ChartDonut
        data={data}
        centerLabel={
          <span className="text-lg font-bold text-[#1a1a1a]">
            {totalCount.toLocaleString("en-IN")}
          </span>
        }
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {data.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong className="tabular-nums">{formatInr(amounts[d.name] ?? 0)}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
