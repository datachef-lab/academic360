import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";

const DATA = [
  { name: "Razorpay", value: 62, color: "#7c3aed" },
  { name: "Paytm", value: 18, color: "#a78bfa" },
  { name: "Cashfree", value: 14, color: "#c4b5fd" },
  { name: "Other", value: 6, color: "#ddd6fe" },
];

export function GatewayMixWidget() {
  return (
    <VisualCard title="Gateway share">
      <ChartDonut
        data={DATA}
        centerLabel={<span className="text-xs font-semibold text-[#1a1a1a]">Online %</span>}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {DATA.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong>{d.value}%</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
