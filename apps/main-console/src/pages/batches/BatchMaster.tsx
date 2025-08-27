import MasterLayout from "@/components/layouts/MasterLayout";
import { BarChart, LayoutDashboard, PlusCircle } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/batches",
    icon: LayoutDashboard, // represents dashboard/home
  },
  {
    title: "Create Batch",
    url: "/dashboard/batches/create",
    icon: PlusCircle, // represents creating something new
  },
  {
    title: "Reports",
    url: "/dashboard/batches/reports",
    icon: BarChart, // Reports/Analytics
  },
];

export default function BatchMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
