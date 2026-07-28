import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { LayoutDashboard, BarChart2, ScrollText, ListTree, FileSignature } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const quickLinks = [
  { title: "Home", url: "/dashboard/document-issuance", icon: LayoutDashboard },
  { title: "Reports", url: "/dashboard/document-issuance/reports", icon: BarChart2 },
];

// Document Types / Issuance Templates / Issuance Logs are still placeholder
// screens, so they are hidden from the nav for now. Their routes remain
// registered — restore the entries here once the pages are built.
const mastersLinks = [
  {
    title: "Certificate Type",
    url: "/dashboard/document-issuance/certificate-master",
    icon: ScrollText,
  },
  {
    title: "Certificate Fields",
    url: "/dashboard/document-issuance/certificate-fields",
    icon: ListTree,
  },
  {
    title: "Declaration Masters",
    url: "/dashboard/document-issuance/declaration-masters",
    icon: FileSignature,
  },
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
