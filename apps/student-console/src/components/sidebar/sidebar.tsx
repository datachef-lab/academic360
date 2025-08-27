import {
  BarChart3,
  BookOpen,
  Briefcase,
  GraduationCap,
  Library,
  ListChecks,
  User2,
} from "lucide-react";

interface Item {
  title: string;
  href: string;
  icon: typeof BarChart3;
  items: Item[];
}

export const items: Item[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    items: [],
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User2,
    items: [],
  },
  {
    title: "Academics",
    href: "/dashboard/academics",
    icon: GraduationCap,
    items: [],
  },
  {
    title: "Exams",
    href: "/dashboard/exams",
    icon: BookOpen,
    items: [],
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: ListChecks,
    items: [],
  },
  {
    title: "Library",
    href: "/dashboard/library",
    icon: Library,
    items: [],
  },
  {
    title: "Admission Fees",
    href: "/dashboard/admission-fees",
    icon: Briefcase,
    items: [],
  },
];
