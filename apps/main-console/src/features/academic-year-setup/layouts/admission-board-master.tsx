import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import {
  GraduationCap,
  ListChecks,
  BookText,
  Layers,
  Ticket,
  SlidersHorizontal,
  XCircle,
  Star,
  Trophy,
  Rows3,
} from "lucide-react";
import ProtectedRouteWrapper from "@/components/globals/ProtectedRouteWrapper";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const BASE = "/dashboard/academic-setup/admissions/master";

const mainLinks = [
  { title: "Eligible Program Courses", url: `${BASE}/program-courses`, icon: Layers },
  { title: "Admission Quota Types", url: `${BASE}/quota-type`, icon: Ticket },
  { title: "Section", url: `${BASE}/sections`, icon: Rows3 },
  { title: "Cancel Source", url: `${BASE}/cancel-sources`, icon: XCircle },
  { title: "Sports Category", url: `${BASE}/sports-categories`, icon: Trophy },
  { title: "Board Subject Mapping", url: `${BASE}/`, icon: GraduationCap },
  { title: "Grades", url: `${BASE}/grades`, icon: Star },
  { title: "Board Subject Mapping Papers", url: `${BASE}/mapping-subjects`, icon: BookText },
];

const masterLinks = [
  { title: "Board", url: `${BASE}/boards`, icon: ListChecks },
  { title: "Subjects", url: `${BASE}/subjects`, icon: BookText },
  { title: "Shift - Section Config", url: `${BASE}/shift-section-config`, icon: SlidersHorizontal },
];

export default function AdmissionBoardMaster() {
  const location = useLocation();
  const currentPath = location.pathname;

  useRestrictTempUsers();

  const rightBarContent = (
    <div className="flex h-full flex-col justify-between gap-4 py-3">
      <ul>
        {mainLinks.map((link) => (
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
        <h3 className="mx-4 mb-1 border-b text-lg font-bold">Masters</h3>
        <ul>
          {masterLinks.map((link) => (
            <NavItem
              key={link.url}
              href={link.url}
              icon={<link.icon />}
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
    <ProtectedRouteWrapper>
      <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
        <Outlet />
      </MasterLayout>
    </ProtectedRouteWrapper>
  );
}
