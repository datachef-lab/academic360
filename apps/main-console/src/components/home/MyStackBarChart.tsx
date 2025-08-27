import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const enrollmentData = [
  {
    year: "2023",
    BCOM: 12000,
    BA: 10500,
    BSC: 11000,
    BBA: 9500,
    MA: 8500,
    MCOM: 8000,
  },
  {
    year: "2022",
    BCOM: 11800,
    BA: 10200,
    BSC: 10800,
    BBA: 9400,
    MA: 8200,
    MCOM: 7900,
  },
  {
    year: "2021",
    BCOM: 11500,
    BA: 10000,
    BSC: 10500,
    BBA: 9200,
    MA: 8100,
    MCOM: 7800,
  },
  {
    year: "2020",
    BCOM: 11300,
    BA: 9700,
    BSC: 10300,
    BBA: 9000,
    MA: 8000,
    MCOM: 7700,
  },
  {
    year: "2019",
    BCOM: 11000,
    BA: 9400,
    BSC: 10100,
    BBA: 8800,
    MA: 7900,
    MCOM: 7600,
  },
  {
    year: "2018",
    BCOM: 10800,
    BA: 9200,
    BSC: 9900,
    BBA: 8600,
    MA: 7800,
    MCOM: 7500,
  },
];
export function MyStackBarChart() {
  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Total Students Enrolled in Each Stream</CardTitle>
        <CardDescription>Comparison of Enrollment by Year</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <BarChart
          width={700}
          height={400}
          data={enrollmentData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="BCOM" fill="#8884d8" />
          <Bar dataKey="BA" fill="#82ca9d" />
          <Bar dataKey="BSC" fill="#ffc658" />
          <Bar dataKey="BBA" fill="#ff7300" />
          <Bar dataKey="MA" fill="#0088fe" />
          <Bar dataKey="MCOM" fill="#a83232" />
        </BarChart>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Yearly student enrollment trends across various streams.
        </div>
        <div className="leading-none text-muted-foreground">
          Hover over the bars for more detailed information about each stream.
        </div>
      </CardFooter>
    </Card>
  );
}
