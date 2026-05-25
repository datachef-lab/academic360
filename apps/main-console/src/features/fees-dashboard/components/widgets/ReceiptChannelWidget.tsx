import { VisualCard } from "../VisualCard";
import { ChartDonut, type DonutSlice } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";
import { PAYMENT_CHANNEL_STATS } from "../../data/mock-data";

const COLORS = ["#7c3aed", "#a78bfa", "#ddd6fe"];

const DATA: DonutSlice[] = PAYMENT_CHANNEL_STATS.map((c, i) => ({
  name: c.channel,
  value: c.studentCount,
  color: COLORS[i % COLORS.length] ?? "#7c3aed",
}));

export function ReceiptChannelWidget() {
  return (
    <VisualCard title="Receipts by channel">
      <ChartDonut
        data={DATA}
        centerLabel={<span className="text-xs font-semibold text-[#1a1a1a]">Students</span>}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {PAYMENT_CHANNEL_STATS.map((c, i) => (
              <li key={c.channel} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
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
