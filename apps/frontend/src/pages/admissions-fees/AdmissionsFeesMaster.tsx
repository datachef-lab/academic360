import MasterLayout, { LinkType } from "@/components/layouts/MasterLayout";
import { LayoutDashboard, UserCheck, IndianRupee, BarChart, Layers, FileText, } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks: LinkType[] = [
  {
    title: "Home",
    url: "/dashboard/admissions-fees",
    icon: LayoutDashboard, // dashboard/home
  },
  {
    title: "Academic Years",
    url: "/dashboard/admissions-fees/academic-years",
    icon: UserCheck, // represents student admission
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
    nestedLinks: [
      {
        title: "Fee Structures",
        url: "/dashboard/admissions-fees/fees",
        icon: Layers,
      },
      {
        title: "Fee Slabs",
        url: "/dashboard/admissions-fees/fees/slabs",
        icon: Layers,
      },
      {
        title: "Fees Head",
        url: "/dashboard/admissions-fees/fees/heads",
        icon: FileText,
      },
    //   {
    //     title: "Fee Receipt Types",
    //     url: "/dashboard/admissions-fees/fees/receipt-types",
    //     icon: Receipt,
    //   },
    //   {
    //     title: "Add-On",
    //     url: "/dashboard/admissions-fees/fees/addons",
    //     icon: Receipt,
    //   },
    //   {
    //     title: "Student Fees",
    //     url: "/dashboard/admissions-fees/fees/student-fees",
    //     icon: Users,
    //   },
    ]
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
