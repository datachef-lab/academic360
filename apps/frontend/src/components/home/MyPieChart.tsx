import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const overallPercentageData = [
  { name: "BCOM", value: 81.5 },
  { name: "BA", value: 84.6 },
  { name: "BSC", value: 88.8 },
  { name: "BBA", value: 77.2 },
  { name: "MA", value: 83.5 },
  { name: "MCOM", value: 78.8 },
];

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#a83232",
];

export function MyPieChart() {
  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Overall Passing Percentage</CardTitle>
        <CardDescription>Comparative View of Streams</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <PieChart width={400} height={400}>
          <Pie
            data={overallPercentageData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            label
          >
            {overallPercentageData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Provides an insight into stream-wise performance percentages.
        </div>
        <div className="leading-none text-muted-foreground">
          Hover over the chart for detailed stream percentages.
        </div>
      </CardFooter>
    </Card>
  );
}
