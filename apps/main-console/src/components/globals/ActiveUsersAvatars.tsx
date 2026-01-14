import { UserAvatar } from "@/hooks/UserAvatar";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ActiveUsersAvatars() {
  const { user } = useAuth();
  const { activeUsers, studentsOnlineCount, isConnected } = useActiveUsers({
    userId: user?.id?.toString(),
  });

  const otherActiveUsers = activeUsers.filter((activeUser) => activeUser.id !== user?.id);

  if (!isConnected || otherActiveUsers.length === 0) {
    return null;
  }

  // Limit to show max 5 avatars, with a "+X" indicator if more
  const maxVisible = 5;
  const visibleUsers = otherActiveUsers.slice(0, maxVisible);
  const remainingCount = otherActiveUsers.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center -space-x-1 sm:-space-x-2">
          {visibleUsers.map((activeUser) => (
            <Tooltip key={activeUser.id}>
              <TooltipTrigger asChild>
                <UserAvatar
                  user={{ name: activeUser.name, image: activeUser.image || undefined }}
                  size="sm"
                  className={[
                    "border-2 border-white hover:border-purple-300 transition-colors cursor-pointer bg-white",
                    activeUser.tabActive === false ? "opacity-70 blur-[1px]" : "",
                  ].join(" ")}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold">{activeUser.name}</div>
                  <div className="text-gray-500">{activeUser.type}</div>
                  {activeUser.tabActive === false && <div className="text-gray-500">Online • Tab inactive</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  {remainingCount} more active {remainingCount === 1 ? "user" : "users"}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {remainingCount > 0 && <span className="hidden sm:inline text-xs text-gray-500">+{remainingCount} more</span>}
        <div
          className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-white flex-shrink-0"
          title={`${otherActiveUsers.length} active ${otherActiveUsers.length === 1 ? "user" : "users"}`}
        />
        {studentsOnlineCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="ml-1 hidden sm:flex items-center justify-center px-2 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                title={`${studentsOnlineCount} students online`}
              >
                Students: {studentsOnlineCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">{studentsOnlineCount} students online</div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
