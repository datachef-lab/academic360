"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOut, ChevronDown, Settings } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
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
              className="data-[state=open]:bg-purple-700 data-[state=open]:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 text-white hover:bg-purple-700 bg-transparent border-0"
            >
              <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto">
                <AvatarImage
                  src={`https://74.207.233.48:8443/hrclIRP/studentimages/${(student as any)?.imgFile}`}
                  alt={user?.name || "student-profile-image"}
                />

                <AvatarFallback className="rounded-lg bg-white text-purple-600 font-semibold text-sm group-data-[collapsible=icon]:text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-white">{user?.name || "Student"}</span>
                <span className="truncate text-xs text-white/80">{user?.payload.uid || ""}</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden text-white/80" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white border border-gray-200 shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm bg-gray-50 rounded-t-lg">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-purple-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-gray-900">{user?.name || "Student"}</span>
                  <span className="truncate text-xs text-gray-600">{user?.payload.uid || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {user?.type === "ADMIN" && (
              <>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                  >
                    <Settings className="mr-3 h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Admin Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-200" />
              </>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              className="px-3 py-2 text-sm hover:bg-red-50 focus:bg-red-50 cursor-pointer rounded-b-lg"
            >
              <LogOut className="mr-3 h-4 w-4 text-red-600" />
              <span className="text-red-700 font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
