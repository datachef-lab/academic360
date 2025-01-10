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
} from "lucide-react";

import { NavMain } from "@/components/globals/NavMain";

import { NavUser } from "@/components/globals/NavUser";
import { TeamSwitcher } from "@/components/globals/TeamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

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
  ],
  navMain: [
    {
      title: "Academics",
      url: "/home",
      icon: GraduationCap,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "/home",
        },
        {
          title: "Get Reports",
          url: "/home/reports",
        },
        {
          title: "Search Student",
          url: "/home/search",
        },
        {
          title: "Manage Marksheet",
          url: "/home/manage-marksheet",
        },
      ],
    },
    {
      title: "Library",
      url: "/home/library",
      icon: BookOpen,
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
    },
    {
      title: "Exam Management",
      url: "#",
      icon: BookCheck,
    },
    {
      title: "Faculty",
      url: "#",
      icon: User,
    },
    {
      title: "Setting",
      url: "#",
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
