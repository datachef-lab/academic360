import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import Cards from "@/components/home/Cards";
import { MyBarChart } from "@/components/home/MyBarChart";
import { MyLineChart } from "@/components/home/MyLineChart";
import { GraduationBarChart } from "@/components/home/GraduationBarChart";
// import { MyPieChart } from "@/components/home/MyPieChart";

const academicYears: string[] = [
    // "2023-24", "2022-23", "2021-22", "2020-21"
];

export default function DashboardStats() {
  const [year, setYear] = useState(academicYears[0] ?? null);

  // Example: You would filter your data based on the selected year
  // For now, just pass the year to children as a prop if needed

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Academic Year Dropdown */}
      <div className="flex items-center gap-4">
        <span className="font-semibold">Academic Year:</span>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 1. Degree-wise Students as Cards */}
      <Cards />

      {/* 2. Course-wise Students as Horizontal Bar Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course-wise Student Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Replace with your actual course-wise bar chart component */}
          <MyBarChart />
        </CardContent>
      </Card>

      {/* 3. New Students Every Year (Bar Chart) */}
      <MyBarChart />

      {/* 4. Passing Stats for Selected Academic Year (Line Chart) */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Passing Stats ({year})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Replace with your actual passing stats line chart component */}
          <MyLineChart />
        </CardContent>
      </Card>

      {/* 5. Graduation Stats (Bar Chart) */}
      <GraduationBarChart />
    </div>
  );
} 