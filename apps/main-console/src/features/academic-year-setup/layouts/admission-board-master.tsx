import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import { GraduationCap, ListChecks, BookText } from "lucide-react";
import ProtectedRouteWrapper from "@/components/globals/ProtectedRouteWrapper";

const nestedHomeLinks = [
  {
    title: "Board Subject Mappings",
    url: "/dashboard/academic-year-setup/board-subjects/",
    icon: GraduationCap,
  },
];

const masterLinks = [
  {
    title: "Board",
    url: "/dashboard/academic-year-setup/board-subjects/boards",
    icon: ListChecks,
  },
  {
    title: "Subjects",
    url: "/dashboard/academic-year-setup/board-subjects/subjects",
    icon: BookText,
  },
];

export default function AdmissionBoardMaster() {
  const location = useLocation();
  const currentPath = location.pathname;

  const rightBarContent = (
    <div className="flex flex-col justify-between gap-4 py-3 h-full">
      <ul>
        {nestedHomeLinks.map((link) => (
          <NavItem key={link.url} href={link.url} icon={<link.icon />} isActive={currentPath === link.url}>
            {link.title}
          </NavItem>
        ))}
      </ul>
      <div>
        <h3 className="text-lg mx-4 mb-1 font-bold border-b">Masters</h3>
        <ul>
          {masterLinks.map((link) => (
            <NavItem key={link.url} href={link.url} icon={<link.icon />} isActive={currentPath.startsWith(link.url)}>
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <ProtectedRouteWrapper>
      <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
        <Outlet />
      </MasterLayout>
    </ProtectedRouteWrapper>
  );
}
