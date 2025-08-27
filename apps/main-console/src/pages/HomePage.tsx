import Cards from "@/components/home/Cards";
import { GraduationBarChart } from "@/components/home/GraduationBarChart";
import { MyBarChart } from "@/components/home/MyBarChart";
import { MyLineChart } from "@/components/home/MyLineChart";
import { MyPieChart } from "@/components/home/MyPieChart";
import { MyStackBarChart } from "@/components/home/MyStackBarChart";

export default function Home() {
  return (
    <>
      <Cards />
      <div className="flex gap-1">
        <MyBarChart />
        <MyLineChart />
      </div>
      <div className="flex gap-1">
        <MyPieChart />
        <GraduationBarChart />
      </div>
      <MyStackBarChart />
    </>
  );
}
