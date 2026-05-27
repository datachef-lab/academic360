import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";

const DATA = [
  { name: "SUCCESS", value: 8412, color: "#7c3aed" },
  { name: "PENDING", value: 84, color: "#c4b5fd" },
  { name: "FAILED", value: 127, color: "#ddd6fe" },
];

const AMOUNTS: Record<string, number> = {
  SUCCESS: 298_400_000,
  PENDING: 2_100_000,
  FAILED: 4_800_000,
};

export function TransactionMixWidget() {
  return (
    <VisualCard title="Transaction status">
      <ChartDonut
        data={DATA}
        centerLabel={
          <span className="text-lg font-bold text-[#1a1a1a]">
            {(8412 + 84 + 127).toLocaleString("en-IN")}
          </span>
        }
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {DATA.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong className="tabular-nums">{formatInr(AMOUNTS[d.name] ?? 0)}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
