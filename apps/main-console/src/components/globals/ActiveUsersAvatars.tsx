// import { UserAvatar } from "@/hooks/UserAvatar";
// import { useActiveUsers } from "@/hooks/useActiveUsers";
// import { useAuth } from "@/features/auth/hooks/use-auth";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import type { StudentDto } from "@repo/db/dtos/user";
// import { getOnlineStudents } from "@/services/student";

// export function ActiveUsersAvatars() {
//   const { user } = useAuth();
//   const { activeUsers, studentsOnlineCount, isConnected } = useActiveUsers({
//     userId: user?.id?.toString(),
//   });

//   const otherActiveUsers = activeUsers.filter((activeUser) => activeUser.id !== user?.id);

//   if (!isConnected || otherActiveUsers.length === 0) {
//     return null;
//   }

//   // Limit to show max 5 avatars, with a "+X" indicator if more
//   const maxVisible = 5;
//   const visibleUsers = otherActiveUsers.slice(0, maxVisible);
//   const remainingCount = otherActiveUsers.length - maxVisible;

//   return (
//     <TooltipProvider delayDuration={200}>
//       <div className="flex items-center gap-1 sm:gap-2">
//         <div className="flex items-center -space-x-1 sm:-space-x-2">
//           {visibleUsers.map((activeUser) => (
//             <Tooltip key={activeUser.id}>
//               <TooltipTrigger asChild>
//                 <UserAvatar
//                   user={{ name: activeUser.name, image: activeUser.image || undefined }}
//                   size="sm"
//                   className={[
//                     "border-2 border-white hover:border-purple-300 transition-colors cursor-pointer bg-white",
//                     activeUser.tabActive === false ? "opacity-70 blur-[1px]" : "",
//                   ].join(" ")}
//                 />
//               </TooltipTrigger>
//               <TooltipContent>
//                 <div className="text-xs">
//                   <div className="font-semibold">{activeUser.name}</div>
//                   <div className="text-gray-500">{activeUser.type}</div>
//                   {activeUser.tabActive === false && <div className="text-gray-500">Online • Tab inactive</div>}
//                 </div>
//               </TooltipContent>
//             </Tooltip>
//           ))}
//           {remainingCount > 0 && (
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
//                   +{remainingCount}
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <div className="text-xs">
//                   {remainingCount} more active {remainingCount === 1 ? "user" : "users"}
//                 </div>
//               </TooltipContent>
//             </Tooltip>
//           )}
//         </div>
//         {remainingCount > 0 && <span className="hidden sm:inline text-xs text-gray-500">+{remainingCount} more</span>}
//         <div
//           className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-white flex-shrink-0"
//           title={`${otherActiveUsers.length} active ${otherActiveUsers.length === 1 ? "user" : "users"}`}
//         />
//         {studentsOnlineCount > 0 && (
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <div
//                 className="ml-1 hidden sm:flex items-center justify-center px-2 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
//                 title={`${studentsOnlineCount} students online`}
//               >
//                 Students: {studentsOnlineCount}
//               </div>
//             </TooltipTrigger>
//             <TooltipContent>
//               <div className="text-xs">{studentsOnlineCount} students online</div>
//             </TooltipContent>
//           </Tooltip>
//         )}
//       </div>
//     </TooltipProvider>
//   );
// }
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { UserAvatar } from "@/hooks/UserAvatar";
// import { useActiveUsers } from "@/hooks/useActiveUsers";
// import { useAuth } from "@/features/auth/hooks/use-auth";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import type { StudentDto } from "@repo/db/dtos/user";
// import { getOnlineStudents } from "@/services/student";

// export function ActiveUsersAvatars() {
//   const { user } = useAuth();
//   const { activeUsers, studentsOnlineCount, isConnected } = useActiveUsers({
//     userId: user?.id?.toString(),
//   });

//   const otherActiveUsers = activeUsers.filter((activeUser) => activeUser.id !== user?.id);

//   if (!isConnected || otherActiveUsers.length === 0) {
//     return null;
//   }

//   // Limit to show max 5 avatars, with a "+X" indicator if more
//   const maxVisible = 5;
//   const visibleUsers = otherActiveUsers.slice(0, maxVisible);
//   const remainingCount = otherActiveUsers.length - maxVisible;

//   return (
//     <TooltipProvider delayDuration={200}>
//       <div className="flex items-center gap-1 sm:gap-2">
//         <div className="flex items-center -space-x-1 sm:-space-x-2">
//           {visibleUsers.map((activeUser) => (
//             <Tooltip key={activeUser.id}>
//               <TooltipTrigger asChild>
//                 <UserAvatar
//                   user={{ name: activeUser.name, image: activeUser.image || undefined }}
//                   size="sm"
//                   className={[
//                     "border-2 border-white hover:border-purple-300 transition-colors cursor-pointer bg-white",
//                     activeUser.tabActive === false ? "opacity-70 blur-[1px]" : "",
//                   ].join(" ")}
//                 />
//               </TooltipTrigger>
//               <TooltipContent>
//                 <div className="text-xs">
//                   <div className="font-semibold">{activeUser.name}</div>
//                   <div className="text-gray-500">{activeUser.type}</div>
//                   {activeUser.tabActive === false && <div className="text-gray-500">Online • Tab inactive</div>}
//                 </div>
//               </TooltipContent>
//             </Tooltip>
//           ))}
//           {remainingCount > 0 && (
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
//                   +{remainingCount}
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <div className="text-xs">
//                   {remainingCount} more active {remainingCount === 1 ? "user" : "users"}
//                 </div>
//               </TooltipContent>
//             </Tooltip>
//           )}
//         </div>
//         {remainingCount > 0 && <span className="hidden sm:inline text-xs text-gray-500">+{remainingCount} more</span>}
//         <div
//           className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-white flex-shrink-0"
//           title={`${otherActiveUsers.length} active ${otherActiveUsers.length === 1 ? "user" : "users"}`}
//         />
//         {studentsOnlineCount > 0 && (
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <div
//                 className="ml-1 hidden sm:flex items-center justify-center px-2 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
//                 title={`${studentsOnlineCount} students online`}
//               >
//                 Students: {studentsOnlineCount}
//               </div>
//             </TooltipTrigger>
//             <TooltipContent>
//               <div className="text-xs">{studentsOnlineCount} students online</div>
//             </TooltipContent>
//           </Tooltip>
//         )}
//       </div>
//     </TooltipProvider>
//   );
// }
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
          {/* {otherActiveUsers.length > 0 && ( */}
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
