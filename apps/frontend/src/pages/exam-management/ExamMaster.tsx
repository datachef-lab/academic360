import { LayoutDashboard, BookOpen, BarChart2 } from "lucide-react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/exam-management",
    icon: LayoutDashboard, // dashboard/home
  },
  {
    title: "Schedule Exam",
    url: "/dashboard/exam-management/create",
    icon: BookOpen, // courses/education
  },
  {
    title: "Reports",
    url: "/dashboard/exam-management/reports",
    icon: BarChart2, // analytics/reports
  },
];

export default function ExamMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
