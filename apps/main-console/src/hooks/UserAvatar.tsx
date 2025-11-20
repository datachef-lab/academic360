import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthUser } from "@/types/Auth/authUser";
import { getColorFromName, getInitials } from "@/utils/avatar";
import { cn } from "@/lib/utils";

type MinimalUser = Pick<AuthUser, "name" | "image"> | { name?: string; image?: string } | null | undefined;

interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  user?: MinimalUser;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export const UserAvatar = React.forwardRef<React.ElementRef<typeof Avatar>, UserAvatarProps>(
  ({ user, size = "md", className = "", ...props }, ref) => {
    const bgColor = getColorFromName(user?.name);

    return (
      <Avatar ref={ref} className={cn(sizeClasses[size], "drop-shadow-xl overflow-hidden", className)} {...props}>
        {user?.image ? (
          <AvatarImage src={user.image} alt={user.name || "User avatar"} className="object-cover" />
        ) : (
          <AvatarFallback
            className={cn("text-white font-semibold flex items-center justify-center uppercase", bgColor)}
          >
            {getInitials(user?.name)}
          </AvatarFallback>
        )}
      </Avatar>
    );
  },
);

UserAvatar.displayName = "UserAvatar";
