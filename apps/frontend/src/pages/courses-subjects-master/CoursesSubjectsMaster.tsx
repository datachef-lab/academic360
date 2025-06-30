import { LayoutDashboard } from "lucide-react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";

const subLinks = [
  {
    title: "Home",
    url: "/dashboard/courses-subjects",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Courses",
    url: "/dashboard/courses-subjects/courses",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Materials",
    url: "/dashboard/courses-subjects/materials",
    icon: LayoutDashboard, // new icon
  },
  {
    title: "Student Mapping",
    url: "/dashboard/courses-subjects/student-mappings",
    icon: LayoutDashboard, // new icon
  },
];

export default function CoursesSubjectsMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
