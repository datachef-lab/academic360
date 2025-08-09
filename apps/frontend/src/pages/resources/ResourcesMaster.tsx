import MasterLayout from "@/components/layouts/MasterLayout";
import {

  SchoolIcon,
  TagIcon,
  GraduationCapIcon,
  HeartIcon,
  LanguagesIcon,
  FileTextIcon,
  DropletIcon,
  BriefcaseIcon,
  BookOpenIcon,
  GlobeIcon,
  WalletIcon,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const subLinks = [
  //   { icon: HomeIcon, title: "Board Universities & Subjects", url: "/dashboard/resources" },
  { icon: SchoolIcon, title: "Institutions", url: "/dashboard/resources" },
  { icon: TagIcon, title: "Categories", url: "/dashboard/resources/categories" },
  { icon: GraduationCapIcon, title: "Degree", url: "/dashboard/resources/degree" },
  { icon: HeartIcon, title: "Religion", url: "/dashboard/resources/religion" },
  { icon: LanguagesIcon, title: "Language Medium", url: "/dashboard/resources/language-medium" },
  { icon: FileTextIcon, title: "Documents", url: "/dashboard/resources/documents" },
  { icon: DropletIcon, title: "Blood Group", url: "/dashboard/resources/blood-group" },
  { icon: BriefcaseIcon, title: "Occupation", url: "/dashboard/resources/occupations" },
  { icon: BookOpenIcon, title: "Qualifications", url: "/dashboard/resources/qualifications" },
  { icon: GlobeIcon, title: "Nationalities", url: "/dashboard/resources/nationalities" },
  { icon: WalletIcon, title: "Annual Income", url: "/dashboard/resources/annual-income" },
];

export default function ResourcesMaster() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
