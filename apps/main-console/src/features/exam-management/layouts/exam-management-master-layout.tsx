import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import {
  LayoutDashboard,
  BookOpen,
  Boxes,
  Layers,
  DoorOpen,
  CalendarClock,
  CheckSquare,
  ClipboardList,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

const topLinks = [
  { title: "Home", url: "/dashboard/exam-management", icon: LayoutDashboard },
  { title: "Schedule Exam", url: "/dashboard/exam-management/schedule", icon: CalendarClock },
  { title: "Exams", url: "/dashboard/exam-management/exams", icon: BookOpen },
];

const mastersLinks = [
  { title: "Exam Components", url: "/dashboard/exam-management/components", icon: Boxes },
  { title: "Floors", url: "/dashboard/exam-management/floors", icon: Layers },
  { title: "Rooms", url: "/dashboard/exam-management/rooms", icon: DoorOpen },
  { title: "Test Types", url: "/dashboard/exam-management/test-types", icon: ClipboardList },
  { title: "Evaluation Types", url: "/dashboard/exam-management/evaluation-types", icon: CheckSquare },
];

export default function ExamManagementMasterLayout() {
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
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
