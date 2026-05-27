import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";

const DATA = [
  { name: "Full payment", value: 7883, color: "#7c3aed" },
  { name: "Installment", value: 2140, color: "#ec4899" },
];

export function MappingTypeWidget() {
  return (
    <VisualCard title="Fee mapping type" className="min-w-0">
      <ChartDonut
        data={DATA}
        footer={
          <ul className="mt-3 space-y-1 border-t border-[#ebebeb] pt-2 text-xs text-[#555]">
            {DATA.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: d.color }}
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <strong className="shrink-0">{d.value.toLocaleString("en-IN")}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
