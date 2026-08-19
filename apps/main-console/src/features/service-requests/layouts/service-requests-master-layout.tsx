import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { ClipboardList, Calendar, Settings, QrCode, LayoutDashboard } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const BASE = "/dashboard/service-requests";

export default function ServiceRequestsMasterLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col h-full py-3">
      <ul className="mt-2 space-y-1">
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          href={`${BASE}/queue`}
          isActive={currentPath === `${BASE}/queue` || currentPath.startsWith(`${BASE}/queue`)}
        >
          Ticket Queue
        </NavItem>
        <NavItem
          icon={<Calendar className="h-5 w-5" />}
          href={`${BASE}/slot-windows`}
          isActive={currentPath.startsWith(`${BASE}/slot-windows`)}
        >
          Slot Windows
        </NavItem>
        <NavItem
          icon={<QrCode className="h-5 w-5" />}
          href={`${BASE}/gate-scanner`}
          isActive={currentPath.startsWith(`${BASE}/gate-scanner`)}
        >
          Gate Scanner
        </NavItem>
      </ul>

      <div className="mt-auto">
        <h3 className="text-lg mx-4 mb-1 font-bold border-b">Info</h3>
        <ul>
          <NavItem
            icon={<ClipboardList className="h-5 w-5" />}
            href={`${BASE}/queue`}
            isActive={false}
          >
            Service Requests
          </NavItem>
          <NavItem
            icon={<Settings className="h-5 w-5" />}
            href={`${BASE}/slot-windows`}
            isActive={false}
          >
            Slot Config
          </NavItem>
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
