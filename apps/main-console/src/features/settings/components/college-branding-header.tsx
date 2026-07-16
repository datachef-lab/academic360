import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranding } from "@/features/settings/hooks/use-branding";
import { cn } from "@/lib/utils";

interface CollegeBrandingHeaderProps {
  className?: string;
  avatarClassName?: string;
  titleClassName?: string;
  showBadge?: boolean;
}

export function CollegeBrandingHeader({
  className,
  avatarClassName = "h-16 w-16 shadow-lg",
  titleClassName = "text-2xl md:text-3xl",
  showBadge = true,
}: CollegeBrandingHeaderProps) {
  const { collegeName, abbreviation, logoUrl, isLoading } = useBranding();

  const showNameSkeleton = isLoading && !collegeName;
  const showAbbrSkeleton = isLoading && !abbreviation;

  return (
    <div
      className={cn(
        "inline-flex items-center space-x-4 w-full bg-white/10 backdrop-blur-xl p-6 shadow-2xl shadow-blue-500/20 border border-white/10",
        className,
      )}
    >
      <Avatar className={cn(avatarClassName)}>
        <AvatarImage src={logoUrl ?? undefined} alt="College logo" />
        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {abbreviation || "—"}
        </AvatarFallback>
      </Avatar>
      <div className="text-left min-w-0 flex-1">
        {showBadge &&
          (showAbbrSkeleton ? (
            <Skeleton className="h-6 w-20 mb-2 bg-white/20" />
          ) : abbreviation ? (
            <Badge
              variant="outline"
              className="text-sm font-bold text-blue-900 bg-blue-50 border-blue-200 mb-2"
            >
              {abbreviation}
            </Badge>
          ) : null)}
        {showNameSkeleton ? (
          <Skeleton className="h-8 w-48 max-w-full bg-white/20" />
        ) : (
          <h1 className={cn("font-bold text-white leading-tight break-words", titleClassName)}>
            {collegeName}
          </h1>
        )}
      </div>
    </div>
  );
}
