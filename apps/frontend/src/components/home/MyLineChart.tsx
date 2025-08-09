import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const chartData: {
  year: string;
  BCOM: number;
  BA: number;
  BSC: number;
  BBA: number;
  MA: number;
  MCOM: number;
}[] = [
  //   { year: "2018", BCOM: 75, BA: 80, BSC: 85, BBA: 70, MA: 78, MCOM: 72 },
  //   { year: "2019", BCOM: 78, BA: 82, BSC: 86, BBA: 74, MA: 80, MCOM: 75 },
  //   { year: "2020", BCOM: 80, BA: 84, BSC: 88, BBA: 76, MA: 82, MCOM: 77 },
  //   { year: "2021", BCOM: 83, BA: 86, BSC: 90, BBA: 79, MA: 85, MCOM: 80 },
  //   { year: "2022", BCOM: 85, BA: 87, BSC: 91, BBA: 81, MA: 87, MCOM: 82 },
  //   { year: "2023", BCOM: 88, BA: 89, BSC: 93, BBA: 83, MA: 89, MCOM: 85 },
];

export function MyLineChart() {
  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Passing Percentage of Students</CardTitle>
        <CardDescription>Year-over-Year Trends</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <LineChart width={600} height={300} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="BCOM" stroke="#8884d8" />
          <Line type="monotone" dataKey="BA" stroke="#82ca9d" />
          <Line type="monotone" dataKey="BSC" stroke="#ffc658" />
          <Line type="monotone" dataKey="BBA" stroke="#ff7300" />
          <Line type="monotone" dataKey="MA" stroke="#0088fe" />
          <Line type="monotone" dataKey="MCOM" stroke="#a83232" />
        </LineChart>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing year-over-year passing trends across all streams.
        </div>
      </CardFooter>
    </Card>
  );
}
