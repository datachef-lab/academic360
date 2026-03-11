import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { CloudUpload, Download, LayoutDashboard } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const topLinks = [{ title: "Home", url: "/dashboard/bulk-upload", icon: LayoutDashboard }];

const toolsLinks = [
  { title: "Upload Data", url: "/dashboard/bulk-upload", icon: CloudUpload },
  // Kept for future expansion when we add a separate download route.
  { title: "Download Data", url: "/dashboard/bulk-upload", icon: Download },
];

export default function BulkUploadMasterLayout() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col h-full py-3">
      <ul className="mt-2">
        {topLinks.map((link) => (
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
        <h3 className="text-lg mx-4 mb-1 font-bold border-b">Tools</h3>
        <ul>
          {toolsLinks.map((link) => (
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
