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

const graduateData = [
  {
    year: "2018",
    BCOM: 5000,
    BA: 5500,
    BSC: 6000,
    BBA: 4500,
    MA: 5200,
    MCOM: 4800,
  },
  {
    year: "2019",
    BCOM: 5200,
    BA: 5700,
    BSC: 6200,
    BBA: 4700,
    MA: 5400,
    MCOM: 5000,
  },
  {
    year: "2020",
    BCOM: 5500,
    BA: 6000,
    BSC: 6500,
    BBA: 4900,
    MA: 5600,
    MCOM: 5200,
  },
  {
    year: "2021",
    BCOM: 5800,
    BA: 6200,
    BSC: 6800,
    BBA: 5100,
    MA: 5900,
    MCOM: 5400,
  },
  {
    year: "2022",
    BCOM: 6000,
    BA: 6500,
    BSC: 7000,
    BBA: 5300,
    MA: 6100,
    MCOM: 5600,
  },
  {
    year: "2023",
    BCOM: 6200,
    BA: 6700,
    BSC: 7300,
    BBA: 5500,
    MA: 6300,
    MCOM: 5800,
  },
];


export function GraduationBarChart() {
  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Graduation Data</CardTitle>
        <CardDescription>Total Students Graduated (Semester 6)</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <BarChart
          width={600}
          height={400}
          data={graduateData}
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
          Yearly graduation data for Semester 6 across all streams.
        </div>
        <div className="leading-none text-muted-foreground">
          Hover over the bars for more detailed information.
        </div>
      </CardFooter>
    </Card>
  );
}
