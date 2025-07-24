import MasterLayout from "@/components/layouts/MasterLayout";
import { Book, Bookmark, Layers, Library, FileText, Shield, GitBranch, Type, GraduationCap } from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
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
    title: "Subject Paper Mapping",
    url: "/dashboard/courses-subjects-design/subject-paper-mapping",
    icon: FileText,
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
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
};

export default CoursesSubjectsMaster;