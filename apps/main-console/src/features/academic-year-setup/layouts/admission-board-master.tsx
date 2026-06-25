import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation, useParams } from "react-router-dom";
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
  Home,
} from "lucide-react";
import ProtectedRouteWrapper from "@/components/globals/ProtectedRouteWrapper";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function AdmissionBoardMaster() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { year } = useParams<{ year: string }>();
  const base = `/dashboard/academic-setup/admissions/${year}/master`;

  useRestrictTempUsers();

  const mainLinks = [
    { title: "Home", url: base, icon: Home },
    { title: "Eligible Program Courses", url: `${base}/program-courses`, icon: Layers },
    { title: "Admission Quota Types", url: `${base}/quota-type`, icon: Ticket },
    { title: "Section", url: `${base}/sections`, icon: Rows3 },
    { title: "Cancel Source", url: `${base}/cancel-sources`, icon: XCircle },
    { title: "Sports Category", url: `${base}/sports-categories`, icon: Trophy },
    { title: "Board Subject Mapping", url: `${base}/board-subject-mapping`, icon: GraduationCap },
    { title: "Grades", url: `${base}/grades`, icon: Star },
  ];

  const masterLinks = [
    { title: "Board", url: `${base}/boards`, icon: ListChecks },
    { title: "Subjects", url: `${base}/subjects`, icon: BookText },
    {
      title: "Shift - Section Config",
      url: `${base}/shift-section-config`,
      icon: SlidersHorizontal,
    },
  ];

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
