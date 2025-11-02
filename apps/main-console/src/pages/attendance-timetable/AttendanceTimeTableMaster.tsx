import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, CalendarCheck2 } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/attendance-timetable",
    icon: LayoutDashboard,
  },
  {
    title: "Timetable",
    url: "/dashboard/attendance-timetable/timetable",
    icon: CalendarCheck2,
  },
];

export default function AttendanceTimeTableMaster() {
  useRestrictTempUsers();
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
