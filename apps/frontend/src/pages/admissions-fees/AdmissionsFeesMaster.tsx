import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, UserCheck, IndianRupee, BarChart } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/admissions-fees",
    icon: LayoutDashboard, // dashboard/home
  },
  {
    title: "Admissions",
    url: "/dashboard/admissions-fees/admissions",
    icon: UserCheck, // represents student admission
  },
  {
    title: "Fees",
    url: "/dashboard/admissions-fees/fees",
    icon: IndianRupee, // fee/payment
  },
  {
    title: "Reports",
    url: "/dashboard/admissions-fees/reports",
    icon: BarChart, // analytics
  },
];

export default function AdmissionsFeesMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
