import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/hooks/UserAvatar";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StudentDto } from "@repo/db/dtos/user";
import { getOnlineStudents } from "@/services/student";
import { OnlineStudentsModal } from "./onlineStudentModal";
import { Users } from "lucide-react";

export function ActiveUsersAvatars() {
  const { user } = useAuth();

  const { activeUsers, studentsOnlineCount, isConnected } = useActiveUsers({
    userId: user?.id?.toString(),
  });

  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

  const {
    data: onlineStudents = [],
    isLoading,
    isError,
  } = useQuery<StudentDto[]>({
    queryKey: ["online-students"],
    queryFn: () => getOnlineStudents(),
    enabled: isStudentsModalOpen,
    staleTime: 30 * 1000,
  });

  const otherActiveUsers = activeUsers.filter((activeUser) => activeUser.id !== user?.id);

  if (!isConnected) {
    return null;
  }

  const maxVisible = 5;
  const visibleUsers = otherActiveUsers.slice(0, maxVisible);

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2">
          {/* Avatars */}
          {otherActiveUsers.length > 0 && (
            <div className="flex items-center -space-x-2">
              {visibleUsers.map((activeUser) => (
                <Tooltip key={activeUser.id}>
                  <TooltipTrigger asChild>
                    <UserAvatar
                      user={{
                        name: activeUser.name,
                        image: activeUser.image || undefined,
                      }}
                      size="sm"
                      className={[
                        "border-2 border-white bg-white hover:border-purple-300 transition",
                        activeUser.tabActive === false ? "opacity-70 blur-[1px]" : "",
                      ].join(" ")}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-semibold">{activeUser.name}</div>
                      <div className="text-muted-foreground">{activeUser.type}</div>
                      {activeUser.tabActive === false && (
                        <div className="text-muted-foreground">Online • Tab inactive</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Online indicator */}
          <div className="h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />

          {studentsOnlineCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsStudentsModalOpen(true)}
                  className="
                   group flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-gradient-to-r from-purple-500 to-purple-600
                   text-white text-sm font-medium
                   shadow-sm shadow-purple-500/25
                   hover:shadow-md hover:shadow-purple-500/40
                   hover:from-purple-600 hover:to-purple-700
                   transition-all duration-200 ease-out
                 "
                >
                  <Users className="h-4 w-4" />

                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold">
                    {studentsOnlineCount}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white text-black ">
                <span className="text-xs">View Online Students</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Modal */}
      <OnlineStudentsModal
        open={isStudentsModalOpen}
        onOpenChange={setIsStudentsModalOpen}
        students={onlineStudents}
        loading={isLoading}
        isError={isError}
      />
    </>
  );
}
