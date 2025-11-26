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
  UserCheck,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const nestedHomeLinks = [
  {
    title: "Program Courses",
    url: "/dashboard/academic-year-setup/course-design",
    icon: Library,
  },
  {
    title: "Subject Groupings",
    url: "/dashboard/academic-year-setup/course-design/subject-groupings",
    icon: Book,
  },
  {
    title: "Subject Paper Mapping",
    url: "/dashboard/academic-year-setup/course-design/subject-paper-mapping",
    icon: FileText,
  },
];

const masterLinks = [
  {
    title: "Academic Years",
    url: "/dashboard/academic-year-setup/course-design/academic-years",
    icon: UserCheck, // represents student admission
  },
  {
    title: "Classes",
    url: "/dashboard/academic-year-setup/course-design/classes",
    icon: Library,
  },
  {
    title: "Paper/Exam Components",
    url: "/dashboard/academic-year-setup/course-design/paper-components",
    icon: Library,
  },
  {
    title: "Courses",
    url: "/dashboard/academic-year-setup/course-design/courses",
    icon: Library,
  },
  {
    title: "Course Types",
    url: "/dashboard/academic-year-setup/course-design/course-types",
    icon: Type,
  },
  {
    title: "Course Levels",
    url: "/dashboard/academic-year-setup/course-design/course-levels",
    icon: Layers,
  },
  {
    title: "Streams",
    url: "/dashboard/academic-year-setup/course-design/streams",
    icon: GitBranch,
  },
  {
    title: "Subjects",
    url: "/dashboard/academic-year-setup/course-design/subjects",
    icon: Book,
  },
  {
    title: "Subject Categories",
    url: "/dashboard/academic-year-setup/course-design/subject-categories",
    icon: Bookmark,
  },
  {
    title: "Affiliations",
    url: "/dashboard/academic-year-setup/course-design/affiliations",
    icon: Shield,
  },
  {
    title: "Regulation Types",
    url: "/dashboard/academic-year-setup/course-design/regulation-types",
    icon: GraduationCap,
  },
];

const CoursesSubjectsMaster = () => {
  useRestrictTempUsers();
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
