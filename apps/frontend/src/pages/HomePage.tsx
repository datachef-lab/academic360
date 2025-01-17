import Cards from "@/components/home/Cards";
import { GraduationBarChart } from "@/components/home/GraduationBarChart";
import { MyBarChart } from "@/components/home/MyBarChart";
import { MyLineChart } from "@/components/home/MyLineChart";
import { MyPieChart } from "@/components/home/MyPieChart";
import { MyStackBarChart } from "@/components/home/MyStackBarChart";
import { Button } from "@/components/ui/button";

import axiosInstance from "@/utils/api";

export default function Home() {
  const handleClick = async () => {
    const response = await axiosInstance.get(`/todoss`);
    console.log(response);
  };

  return (
    <>
      <div>
        <Button
          onClick={() => {
            // toast("Error");
            handleClick();
          }}
        >
          Click Me
        </Button>
      </div>
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
