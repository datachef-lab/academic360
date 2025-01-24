import * as React from "react";
import {
  BookCheck,
  BookOpen,
  CalendarCheck2,
  GalleryVerticalEnd,
  GraduationCap,
  Settings,
  User,
  UserPlus,
  Workflow,
} from "lucide-react";

import { NavMain } from "@/components/globals/NavMain";

import { NavUser } from "@/components/globals/NavUser";
import { TeamSwitcher } from "@/components/globals/TeamSwitcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  teams: [
    {
      name: "academic360",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
    {
      name: "Issues",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
    {
      name: "Leaves",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
    {
      name: "Notices",
      logo: GalleryVerticalEnd,
      plan: "#development-mode",
    },
  ],
  navMain: [
    {
      title: "My Workspace",
      url: "/home",
      icon: Workflow,
    },
    {
      title: "Academics",
      url: "/home/academics",
      icon: GraduationCap,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "/home/academics",
        },
        {
          title: "Get Reports",
          url: "/home/academics-reports",
        },
        {
          title: "Search Student",
          url: "/home/academics-search",
        },
        {
          title: "Manage Marksheet",
          url: "/home",
        },
      ],
    },
    {
      title: "Library",
      url: "/home/library",
      icon: BookOpen,
      items: [
        { title: "Dashboard", url: "/home" },
        { title: "Book Catalog", url: "/home" },
        { title: "Issue/Return", url: "/home" },
        { title: "Fines", url: "/home" },
        { title: "Reports", url: "/home" },
      ],
    },
    {
      title: "Attendance",
      url: "#",
      icon: CalendarCheck2,
    },
    {
      title: "Admission Dept.",
      url: "#",
      icon: UserPlus,
      items: [
        { title: "Dashboard", url: "/home" },
        { title: "Applications", url: "/home" },
        { title: "New Admission", url: "/home" },
        { title: "Fee Management", url: "/home" },
        { title: "Reports", url: "/home" },
      ],
    },
    {
      title: "Exam Management",
      url: "#",
      icon: BookCheck,
      items: [
        {
          title: "Examboard",
          url: "/home",
        },
      ],
    },
    {
      title: "Faculty",
      url: "/home",
      icon: User,
    },
    {
      title: "Setting",
      url: "settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="px-0 flex justify-center">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
