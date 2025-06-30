import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/admissions-fees",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Admissions",
    url: "/dashboard/admissions-fees/admissions",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Fees",
    url: "/dashboard/admissions-fees/fees",
    icon: LayoutDashboard, // new icon
  },
];

export default function AdmissionsFeesMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
