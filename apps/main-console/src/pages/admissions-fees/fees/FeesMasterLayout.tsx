import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  BarChart2,
  Percent,
  PlusCircle,
  FolderTree,
  Users,
  Link2,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const topLinks = [
  { title: "Home", url: "/dashboard/fees", icon: LayoutDashboard },
  { title: "Fees Structure", url: "/dashboard/fees/structure", icon: Receipt },
  { title: "Student Fee Categories", url: "/dashboard/fees/fee-category-promotion-mapping", icon: Link2 },
  { title: "Student Fees", url: "/dashboard/fees/student-fees", icon: Users },
  { title: "Reports", url: "/dashboard/fees/reports", icon: BarChart2 },
];

const mastersLinks = [
  // { title: "Fees Slabs", url: "/dashboard/fees/slabs", icon: Layers },
  { title: "Fee Concession Slabs", url: "/dashboard/fees/fee-concession-slab", icon: Percent },
  { title: "Fee Categories", url: "/dashboard/fees/fee-category", icon: FolderTree },
  { title: "Fees Heads", url: "/dashboard/fees/heads", icon: FileText },
  { title: "Fee Receipts", url: "/dashboard/fees/fee-receipts", icon: Receipt },
  { title: "Addon", url: "/dashboard/fees/addon", icon: PlusCircle },
];

export default function FeesMasterLayout() {
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
