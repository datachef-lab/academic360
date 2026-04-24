import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { LayoutDashboard, ScrollText, ListTree } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const quickLinks = [{ title: "Home", url: "/dashboard/career-progression", icon: LayoutDashboard }];

const mastersLinks = [
  {
    title: "Certificate Type",
    url: "/dashboard/career-progression/certificate-master",
    icon: ScrollText,
  },
  {
    title: "Certificate fields",
    url: "/dashboard/career-progression/certificate-fields",
    icon: ListTree,
  },
];

export default function CareerProgressionMasterLayout() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col h-full py-3">
      <ul className="mt-2">
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

      <div className="mt-auto">
        <h3 className="text-lg mx-4 mb-1 font-bold border-b">Masters</h3>
        <ul>
          {mastersLinks.map((link) => (
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
