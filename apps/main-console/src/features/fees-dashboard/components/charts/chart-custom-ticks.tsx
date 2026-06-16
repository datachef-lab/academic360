import {
  formatHourTo12h,
  formatMonthYearTick,
  formatProgramTick,
} from "../../utils/chart-axis-format";

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
};

export function HourXTick({ x, y, payload }: TickProps) {
  if (x == null || y == null || payload?.value == null) return null;
  const label = formatHourTo12h(String(payload.value));
  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="#1a1a1a" fontSize={10} fontWeight={600}>
      {label}
    </text>
  );
}

export function ProgramXTick({ x, y, payload }: TickProps) {
  if (x == null || y == null || payload?.value == null) return null;
  const label = formatProgramTick(String(payload.value));
  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="#1a1a1a" fontSize={10} fontWeight={600}>
      {label}
    </text>
  );
}

export function MonthXTick({ x, y, payload }: TickProps) {
  if (x == null || y == null || payload?.value == null) return null;
  const full = formatMonthYearTick(String(payload.value));
  const [month, year] = full.split(" ");
  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#1a1a1a" fontSize={9} fontWeight={600}>
      <tspan x={x} dy={0}>
        {month}
      </tspan>
      {year ? (
        <tspan x={x} dy={12}>
          {year}
        </tspan>
      ) : null}
    </text>
  );
}

export function CountYTick({ x, y, payload }: TickProps) {
  if (x == null || y == null || payload?.value == null) return null;
  return (
    <text x={x - 6} y={y + 4} textAnchor="end" fill="#1a1a1a" fontSize={10} fontWeight={500}>
      {Number(payload.value).toLocaleString("en-IN")}
    </text>
  );
}

export function LakhYTick({ x, y, payload }: TickProps) {
  if (x == null || y == null || payload?.value == null) return null;
  return (
    <text x={x - 6} y={y + 4} textAnchor="end" fill="#1a1a1a" fontSize={10} fontWeight={500}>
      {payload.value}
    </text>
  );
}
