import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";
import { LayoutDashboard, Users2, UserPlus, BadgeCheck, FileText, Building2 } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const basePath = "/dashboard/user-groups-accesses";

const subLinks = [
  {
    title: "Home",
    url: basePath,
    icon: LayoutDashboard,
  },
  {
    title: "User Directory",
    url: `${basePath}/faculties`,
    icon: Users2,
  },
  {
    title: "Add User",
    url: `${basePath}/create`,
    icon: UserPlus,
  },
  {
    title: "Departments",
    url: `${basePath}/departments`,
    icon: Building2,
  },
  {
    title: "Roles & Permissions",
    url: `${basePath}/roles`,
    icon: BadgeCheck,
  },
  {
    title: "Reports",
    url: `${basePath}/reports`,
    icon: FileText,
  },
];

export default function UserGroupsAccessMaster() {
  useRestrictTempUsers();
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
