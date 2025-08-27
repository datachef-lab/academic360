import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";

import { LayoutDashboard, UserPlus, Search, DownloadCloud } from "lucide-react";

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
    title: "Search Students",
    url: "#", // Default URL for modal links
    isModal: true,
    icon: Search,
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
