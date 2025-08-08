// import { NavItem } from "@/components/globals/AppSidebar";
import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { useLocation } from "react-router-dom";
import {
  Book,
  Bookmark,
  Layers,
  Library,
  FileText,
  Shield,
  GitBranch,
  Type,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const nestedHomeLinks = [
  {
    title: "Program Courses",
    url: "/dashboard/courses-subjects-design",
    icon: Library,
  },
  {
    title: "Subject Paper Mapping",
    url: "/dashboard/courses-subjects-design/subject-paper-mapping",
    icon: FileText,
  },
];

const masterLinks = [
  {
    title: "Courses",
    url: "/dashboard/courses-subjects-design/courses",
    icon: Library,
  },
  {
    title: "Course Types",
    url: "/dashboard/courses-subjects-design/course-types",
    icon: Type,
  },
  {
    title: "Course Levels",
    url: "/dashboard/courses-subjects-design/course-levels",
    icon: Layers,
  },
  {
    title: "Streams",
    url: "/dashboard/courses-subjects-design/streams",
    icon: GitBranch,
  },
  {
    title: "Subjects",
    url: "/dashboard/courses-subjects-design/subjects",
    icon: Book,
  },
  {
    title: "Subject Categories",
    url: "/dashboard/courses-subjects-design/subject-categories",
    icon: Bookmark,
  },
  {
    title: "Affiliations",
    url: "/dashboard/courses-subjects-design/affiliations",
    icon: Shield,
  },
  {
    title: "Sessions",
    url: "/dashboard/courses-subjects-design/sessions",
    icon: Calendar,
  },
  {
    title: "Affiliation Types",
    url: "/dashboard/courses-subjects-design/affiliation-types",
    icon: Shield,
  },
  {
    title: "Regulation Types",
    url: "/dashboard/courses-subjects-design/regulation-types",
    icon: GraduationCap,
  },
];

const CoursesSubjectsMaster = () => {
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
    <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
};

export default CoursesSubjectsMaster;
