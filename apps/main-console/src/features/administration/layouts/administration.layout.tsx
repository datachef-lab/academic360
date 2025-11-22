import { Outlet, useLocation } from "react-router-dom";
import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { LayoutDashboard, Users2, BadgeCheck, Building2, ShieldCheck, UserCog } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const basePath = "/dashboard/user-groups-accesses";

const quickLinks = [
  { title: "Home", url: `${basePath}`, icon: LayoutDashboard },
  { title: "User Directory", url: `${basePath}/faculties`, icon: Users2 },
];

const masterLinks = [
  { title: "User Groups", url: `${basePath}/user-groups`, icon: UserCog },
  { title: "Departments", url: `${basePath}/departments`, icon: Building2 },
  { title: "Designations", url: `${basePath}/designations`, icon: BadgeCheck },
  { title: "Roles & Permissions", url: `${basePath}/roles`, icon: ShieldCheck },
];

export default function UserGroupsAccessLayout() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col h-full py-3">
      <div>
        <ul>
          {quickLinks.map((link) => (
            <NavItem
              key={link.title}
              icon={<link.icon className="h-5 w-5" />}
              href={link.url}
              isActive={currentPath === link.url}
            >
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <h3 className="text-base mx-4 mb-1 font-semibold border-b">Masters</h3>
        <ul>
          {masterLinks.map((link) => (
            <NavItem
              key={link.title}
              icon={<link.icon className="h-5 w-5" />}
              href={link.url}
              isActive={currentPath.startsWith(link.url)}
            >
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
