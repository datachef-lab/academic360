import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, Users2, UserPlus, BadgeCheck, FileText, Building2 } from "lucide-react";
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
    title: "Add Faculty/Staff",
    url: "/dashboard/faculty-staff/create",
    icon: UserPlus,
  },
  {
    title: "Departments",
    url: "/dashboard/faculty-staff/departments",
    icon: Building2,
  },
  {
    title: "Roles & Permissions",
    url: "/dashboard/faculty-staff/roles",
    icon: BadgeCheck,
  },
  {
    title: "Reports",
    url: "/dashboard/faculty-staff/reports",
    icon: FileText,
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
