import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, Users2, BadgeCheck, Building2 } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/faculty-staff",
    icon: LayoutDashboard,
  },
  {
    title: "Faculty List",
    url: "/dashboard/faculty-staff/faculties",
    icon: Users2,
  },
  {
    title: "Departments",
    url: "/dashboard/faculty-staff/departments",
    icon: Building2,
  },
  {
    title: "Designations",
    url: "/dashboard/faculty-staff/designations",
    icon: BadgeCheck,
  },
  {
    title: "Roles & Permissions",
    url: "/dashboard/faculty-staff/roles",
    icon: BadgeCheck,
  },
];

export default function FacultyStaffMaster() {
  useRestrictTempUsers();
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
