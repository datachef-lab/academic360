import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, BookOpenCheck, Book } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/library",
    icon: LayoutDashboard,
  },
  {
    title: "Issued Books",
    url: "/dashboard/library/issued",
    icon: BookOpenCheck,
  },
  //   {
  //     title: "Archived Books",
  //     url: "/dashboard/library/archived",
  //     icon: Archive,
  //   },
  {
    title: "Catalog",
    url: "/dashboard/library/catalog",
    icon: Book,
  },
  //   {
  //     title: "Fine Management",
  //     url: "/dashboard/library/fine-management",
  //     icon: IndianRupee,
  //   },
  //   {
  //     title: "Reports",
  //     url: "/dashboard/library/lib-report",
  //     icon: BarChart2,
  //   },
];
export default function LibraryMaster() {
  useRestrictTempUsers();
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
