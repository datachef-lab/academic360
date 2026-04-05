import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useLocation } from "react-router-dom";
import { FileText, Library, Workflow } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const BASE = "/dashboard/academic-year-setup/student-promotion-logic";

const nestedHomeLinks = [
  {
    title: "Promotion Builder",
    url: BASE,
    icon: Workflow,
  },
];

const masterLinks = [
  {
    title: "Classes",
    url: `${BASE}/classes`,
    icon: Library,
  },
  {
    title: "Promotion Clauses",
    url: `${BASE}/promotion-clauses`,
    icon: FileText,
  },
];

export default function StudentPromotionLogicMaster() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col justify-between gap-4 py-3 h-full">
      <ul>
        {nestedHomeLinks.map((link) => (
          <NavItem
            key={link.url}
            href={link.url}
            icon={<link.icon />}
            isActive={currentPath === link.url}
          >
            {link.title}
          </NavItem>
        ))}
      </ul>
      <div>
        <h3 className="text-lg mx-4 mb-1 font-bold border-b">Masters</h3>
        <ul>
          {masterLinks.map((link) => (
            <NavItem
              key={link.url}
              href={link.url}
              icon={<link.icon />}
              isActive={currentPath === link.url}
            >
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
