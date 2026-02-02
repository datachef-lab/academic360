import { Href } from "expo-router";
import {
  BellIcon,
  BookOpenIcon,
  ClipboardListIcon,
  CogIcon,
  FileTextIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  HouseIcon,
  LifeBuoyIcon,
  LucideIcon,
  PartyPopperIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react-native";

export type SidebarItemsType = {
  label: string;
  icon: LucideIcon;
  oneLiner: string;
  path: Href;
};

export const sidebarItems = [
  {
    label: "My Profile",
    icon: UserIcon,
    path: "/console/profile",
    oneLiner: "View and update your profile details",
  },
  {
    label: "Home",
    icon: HouseIcon,
    path: "/console",
    oneLiner: "Your dashboard at a glance",
  },
  {
    label: "Current Academic Status",
    icon: GraduationCapIcon,
    path: "/console/academics/current-status",
    oneLiner: "Track your semester and enrollment status",
  },
  {
    label: "Academics",
    icon: BookOpenIcon,
    path: "/console/academics",
    oneLiner: "Courses, grades, and attendance",
  },
  {
    label: "Service Requests",
    icon: ClipboardListIcon,
    path: "/console/service-requests",
    oneLiner: "Raise and track student requests",
  },
  {
    label: "Events & Participations",
    icon: PartyPopperIcon,
    path: "/console/events",
    oneLiner: "View events you joined and certificates earned",
  },
  {
    label: "Certificates & Documents",
    icon: FileTextIcon,
    path: "/console/documents",
    oneLiner: "Download certificates and records",
  },
  {
    label: "Notifications",
    icon: BellIcon,
    path: "/console/notifications",
    oneLiner: "Important updates and alerts",
  },
  {
    label: "Settings",
    icon: CogIcon,
    path: "/console/settings",
    oneLiner: "Manage preferences and security",
  },
  {
    label: "Help & Support",
    icon: LifeBuoyIcon,
    path: "/console/support",
    oneLiner: "Get help with portal or services",
  },
  {
    label: "FAQs",
    icon: HelpCircleIcon,
    path: "/console/faqs",
    oneLiner: "Quick answers to common questions",
  },
  {
    label: "Contact College",
    icon: PhoneIcon,
    path: "/console/contact",
    oneLiner: "Reach your college administration",
  },
] as const satisfies readonly SidebarItemsType[];
