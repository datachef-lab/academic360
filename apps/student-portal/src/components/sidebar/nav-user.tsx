"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOut, ChevronDown, Settings } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useStudent } from "@/providers/student-provider";

export function NavUser() {
  const { user, logout } = useAuth();
  const { student } = useStudent();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "ST";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
            >
              <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto">
                <AvatarImage
                  src={`https://74.207.233.48:8443/hrclIRP/studentimages/${student?.imgFile}`}
                  alt={student?.name || "student-profile-image"}
                />

                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm group-data-[collapsible=icon]:text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {user?.name || "Student"}
                </span>
                <span className="truncate text-xs">
                  {user?.codeNumber || ""}
                </span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name || "Student"}
                  </span>
                  <span className="truncate text-xs">
                    {user?.codeNumber || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {user?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
