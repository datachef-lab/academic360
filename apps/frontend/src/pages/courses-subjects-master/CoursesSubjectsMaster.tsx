import { LayoutDashboard, BookOpen, FileText, BarChart } from "lucide-react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/courses-subjects",
    icon: LayoutDashboard, // dashboard/home
  },
  {
    title: "Courses",
    url: "/dashboard/courses-subjects/courses",
    icon: BookOpen, // represents courses, education
  },
  {
    title: "Materials",
    url: "/dashboard/courses-subjects/materials",
    icon: FileText, // documents/materials
  },
  {
    title: "Reports",
    url: "/dashboard/batches/reports",
    icon: BarChart, // Reports/Analytics
  },
];

export default function CoursesSubjectsMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
