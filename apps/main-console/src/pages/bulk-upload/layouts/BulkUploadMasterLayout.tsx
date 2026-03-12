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

  return (
    <MasterLayout>
      <Outlet />
    </MasterLayout>
  );
}
