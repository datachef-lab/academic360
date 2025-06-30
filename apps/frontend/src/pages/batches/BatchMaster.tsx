import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/batches",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Admissions",
    url: "/dashboard/batches/create",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Fees",
    url: "/dashboard/batches/fees",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Student Mapping",
    url: "/dashboard/batches/student-mapping",
    icon: LayoutDashboard, // new icon
  },
];

export default function BatchMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
