import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { LayoutDashboard, BarChart2, FileText, Layers, ClipboardList } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const quickLinks = [
  { title: "Home", url: "/dashboard/document-issuance", icon: LayoutDashboard },
  { title: "Reports", url: "/dashboard/document-issuance/reports", icon: BarChart2 },
];

const mastersLinks = [
  { title: "Document Types", url: "/dashboard/document-issuance/types", icon: FileText },
  { title: "Issuance Templates", url: "/dashboard/document-issuance/templates", icon: Layers },
  { title: "Issuance Logs", url: "/dashboard/document-issuance/logs", icon: ClipboardList },
];

export default function DocumentIssuanceMasterLayout() {
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
              isActive={currentPath === link.url || currentPath.startsWith(link.url)}
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
