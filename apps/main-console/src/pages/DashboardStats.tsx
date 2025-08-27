import  { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import Cards from "@/components/home/Cards";
import { ChartBarHorizontal } from "@/components/charts/ChartBarHorizontal";

const academicYears = ["2023-24", "2022-23", "2021-22", "2020-21"];

const courseStats = [
  { label: "B.Com Hons", value: 12000 },
  { label: "BA English", value: 3000 },
  { label: "B.Sc Physics", value: 2500 },
  { label: "B.Sc Chemistry", value: 2200 },
  { label: "B.Sc Mathematics", value: 2100 },
  { label: "BBA", value: 2307 },
  { label: "M.A History", value: 577 },
  { label: "M.A English", value: 600 },
  { label: "M.Com", value: 678 },
  { label: "B.Sc Computer Science", value: 1800 },
  { label: "B.Sc Botany", value: 900 },
  { label: "B.Sc Zoology", value: 950 },
  { label: "B.Sc Statistics", value: 800 },
  { label: "B.Sc Economics", value: 850 },
  { label: "B.Sc Microbiology", value: 700 },
  { label: "B.Sc Environmental Science", value: 650 },
  { label: "B.Sc Electronics", value: 600 },
  { label: "B.Sc Geology", value: 550 },
  { label: "B.Sc Geography", value: 500 },
  { label: "B.Sc Psychology", value: 450 },
  { label: "B.Sc Sociology", value: 400 },
  { label: "B.Sc Philosophy", value: 350 },
  { label: "B.Sc Political Science", value: 300 },
  { label: "B.Sc Anthropology", value: 250 },
  { label: "B.Sc Linguistics", value: 200 },
];

export default function DashboardStats() {
  const [year, setYear] = useState(academicYears[0]);

  // In a real app, filter courseStats by year

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
      <ChartBarHorizontal data={courseStats} title="Course-wise Student Stats" description={`Showing stats for ${year}`} />
    </div>
  );
} 