import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, UserCircle2, FileDiff, FileInput } from "lucide-react";

export default function ExamLayoutMaster() {
  const { examId } = useParams();
  const location = useLocation();
  const currentPath = location.pathname;

  const base = `/dashboard/exam-management/exams/${examId}`;

  const topLinks = [
    { title: "Overview", url: `${base}`, icon: LayoutDashboard },
    { title: "Invigilators", url: `${base}/invigilators`, icon: Users },
    { title: "Support Staff", url: `${base}/support-staff`, icon: UserCheck },
    { title: "Examiners", url: `${base}/examiners`, icon: UserCircle2 },
    { title: "Allot Answerscripts", url: `${base}/allot`, icon: FileInput },
    { title: "Collect Answerscripts", url: `${base}/collect`, icon: FileDiff },
  ];

  const rightBarContent = (
    <div className="flex flex-col gap-2 py-3 h-full">
      <ul className="space-y-1">
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
    </div>
  );

  return (
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
