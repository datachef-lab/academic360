import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";

import { LayoutDashboard, UserPlus, FilePlus, Search, BarChart2, DownloadCloud } from "lucide-react";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/students",
    icon: LayoutDashboard,
  },
  {
    title: "Create Student",
    url: "/dashboard/students/create",
    icon: UserPlus,
  },
  {
    title: "Add Marksheet",
    url: "/dashboard/students/add-marksheet",
    icon: FilePlus,
  },
  {
    title: "Search Students",
    url: "#", // Default URL for modal links
    isModal: true,
    icon: Search,
  },
  {
    title: "Reports",
    url: "/dashboard/students/reports",
    icon: BarChart2,
  },
  {
    title: "Downloads",
    url: "/dashboard/students/downloads",
    icon: DownloadCloud,
  },
];

export default function StudentMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
