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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
          <MyBarChart />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
          <MyLineChart />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
          <MyPieChart />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
          <GraduationBarChart />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center col-span-1 lg:col-span-2">
          <MyStackBarChart />
        </div>
      </div>
    </>
  );
}
