import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";
import { KPI_STATS } from "../../data/mock-data";

const collected = KPI_STATS.collected;
const pending = KPI_STATS.pending;

const DATA = [
  { name: "Collected", value: collected, color: "#7c3aed" },
  { name: "Pending", value: pending, color: "#a78bfa" },
];

export function CollectionMixWidget() {
  return (
    <VisualCard title="Receivable mix">
      <ChartDonut
        data={DATA}
        centerLabel={
          <>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#1a1a1a]">
              Collection
            </span>
            <span className="text-lg font-bold text-[#1a1a1a]">
              {KPI_STATS.collectionEfficiency}%
            </span>
          </>
        }
        tooltipFormatter={(v) => formatInr(v)}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {DATA.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong className="tabular-nums">{formatInr(d.value)}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
