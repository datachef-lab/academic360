import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartData = [
  {
    year: "2017",
    BCOM: 120,
    BA: 80,
    BSC: 100,
    BBA: 60,
    MA: 50,
    MSC: 40,
    MCOM: 70,
    MBA: 30,
  },
  {
    year: "2018",
    BCOM: 150,
    BA: 100,
    BSC: 110,
    BBA: 80,
    MA: 60,
    MSC: 50,
    MCOM: 90,
    MBA: 40,
  },
  {
    year: "2019",
    BCOM: 180,
    BA: 120,
    BSC: 130,
    BBA: 90,
    MA: 70,
    MSC: 60,
    MCOM: 100,
    MBA: 50,
  },
  {
    year: "2020",
    BCOM: 200,
    BA: 140,
    BSC: 150,
    BBA: 110,
    MA: 80,
    MSC: 70,
    MCOM: 120,
    MBA: 60,
  },
  {
    year: "2021",
    BCOM: 220,
    BA: 160,
    BSC: 170,
    BBA: 130,
    MA: 90,
    MSC: 80,
    MCOM: 140,
    MBA: 70,
  },
  {
    year: "2022",
    BCOM: 240,
    BA: 180,
    BSC: 190,
    BBA: 150,
    MA: 100,
    MSC: 90,
    MCOM: 160,
    MBA: 80,
  },
];

const chartColors = {
  BCOM: "#ff7300",
  BA: "#387908",
  BSC: "#8884d8",
  BBA: "#82ca9d",
  MA: "#ffc658",
  MSC: "#a4de6c",
  MCOM: "#d0ed57",
  MBA: "#8dd1e1",
};

export function MyBarChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Students by Streams</CardTitle>
        <CardDescription>January - December 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(chartColors).map((stream) => (
                <Bar
                  key={stream}
                  dataKey={stream}
                  fill={chartColors[stream as keyof typeof chartColors]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total new students across different streams for the last year.
        </div>
      </CardFooter>
    </Card>
  );
}
