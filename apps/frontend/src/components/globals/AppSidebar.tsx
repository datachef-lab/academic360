import * as React from "react";
import { FaUserGraduate } from "react-icons/fa";
import {

  BookOpen,
  BookCheck,
  
  CalendarCheck2,
  GalleryVerticalEnd,
  GraduationCap,
  Settings,
 
  UserPlus,
} from "lucide-react";

import { NavMain } from "@/components/globals/NavMain";
import { NavProjects } from "@/components/globals/NavProjects";
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
      name: "acadmic360",
      logo: GalleryVerticalEnd,
      plan:"",
     
    },
   
  ],
  navMain: [
    {
      title: "Academics",
      url: "#",
      icon: GraduationCap,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "#",
        },
        {
          title: "Get Reports",
          url: "#",
        },
        {
          title:"Search Student",
          url:"#"
        },
        {
          title: "Manage Marksheet",
          url: "#",
        },
      ],
    },
    {
      title: "Library",
      url: "#",
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
      icon:  FaUserGraduate,
    
    },
    {
      title: "Setting",
      url: "#",
      icon:  Settings,
    
    },
   
  ],
  navButton: [
    
    
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
        <NavProjects projects={data.navButton} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
