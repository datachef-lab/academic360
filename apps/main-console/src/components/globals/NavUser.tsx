import { BadgeCheck, Bell, LogOut } from "lucide-react";
import { UserAvatar } from "@/hooks/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { logout } from "@/features/auth/services/auth-service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function NavUser() {
  const { user } = useAuth();
  const { isMobile } = useSidebar();

  const navigate = useNavigate();

  // ✅ Use `useMutation` for logout action
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast.success("Logged out successfully!!");
      navigate("/", { replace: true });
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent focus:bg-transparent"
            >
              {/* We only need name/image for avatar visuals */}
              <UserAvatar
                user={
                  { name: user?.name || undefined, image: user?.image || undefined } as unknown as {
                    name?: string;
                    image?: string;
                  }
                }
                size="sm"
                className="ml-1 rounded-full"
              />
              {/* <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div> */}
              {/* <ChevronsUpDown className="ml-auto size-4" /> */}
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
                <UserAvatar
                  user={
                    { name: user?.name || undefined, image: user?.image || undefined } as unknown as {
                      name?: string;
                      image?: string;
                    }
                  }
                  size="sm"
                  className="rounded-full"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
