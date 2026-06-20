import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getColorFromName, getInitials } from "@/utils/avatar";

type Props = React.ComponentPropsWithoutRef<typeof Avatar> & {
  uid?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

const API_BASE = import.meta.env.VITE_APP_BACKEND_URL ?? "";

/**
 * Canonical student-avatar component. Hits the unified backend resolver which
 * runs the S3 → besc → hrclIRP → previous-uid chain server-side; on 404 the
 * <AvatarImage> error path drops to the initials fallback automatically.
 */
export function StudentAvatar({ uid, name, size = "md", className, ...props }: Props) {
  const src = uid ? `${API_BASE}/api/students/uid/${encodeURIComponent(uid)}/avatar` : null;
  const bgColor = getColorFromName(name ?? undefined);

  return (
    <Avatar className={cn(SIZE_CLASS[size], "overflow-hidden", className)} {...props}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name ? `${name} avatar` : "Student avatar"}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "text-white font-semibold flex items-center justify-center uppercase",
          bgColor,
        )}
      >
        {getInitials(name ?? undefined)}
      </AvatarFallback>
    </Avatar>
  );
}
