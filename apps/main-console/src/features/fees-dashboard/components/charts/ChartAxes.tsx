import { XAxis, YAxis } from "recharts";
import { CountYTick, HourXTick, LakhYTick, MonthXTick, ProgramXTick } from "./chart-custom-ticks";

/** Plot margins — tick text is drawn via custom SVG ticks below the plot */
export const CHART_MARGIN = {
  top: 12,
  right: 16,
  left: 8,
  bottom: 8,
} as const;

export const CHART_MARGIN_LEGEND = {
  top: 12,
  right: 16,
  left: 8,
  bottom: 32,
} as const;

export function ChartMonthXAxis() {
  return (
    <XAxis
      dataKey="monthLabel"
      tick={<MonthXTick />}
      tickMargin={4}
      height={52}
      interval={0}
      minTickGap={0}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartAmountLakhYAxis() {
  return (
    <YAxis
      tick={<LakhYTick />}
      tickMargin={4}
      width={52}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartProgramXAxis() {
  return (
    <XAxis
      dataKey="program"
      tick={<ProgramXTick />}
      tickMargin={4}
      interval={0}
      minTickGap={0}
      height={40}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartStudentCountYAxis() {
  return (
    <YAxis
      tick={<CountYTick />}
      tickMargin={4}
      width={52}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartChannelXAxis() {
  return (
    <XAxis
      dataKey="channel"
      tick={{ fontSize: 10, fill: "#1a1a1a", fontWeight: 600 }}
      tickMargin={8}
      height={36}
      interval={0}
      axisLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartStudentsYAxis() {
  return <YAxis yAxisId="left" tick={<CountYTick />} width={44} />;
}

export function ChartLakhYAxisRight() {
  return <YAxis yAxisId="right" orientation="right" tick={<LakhYTick />} width={44} />;
}

export function ChartHourXAxis() {
  return (
    <XAxis
      dataKey="hour"
      tick={<HourXTick />}
      tickMargin={4}
      height={36}
      interval={0}
      minTickGap={0}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}

export function ChartActivityYAxis() {
  return (
    <YAxis
      tick={<CountYTick />}
      tickMargin={4}
      width={44}
      allowDecimals={false}
      axisLine={{ stroke: "#b8b8b8" }}
      tickLine={{ stroke: "#b8b8b8" }}
    />
  );
}
