import { SemesterPromotionScreen } from "@/features/promote-students";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function PromoteStudentsPage() {
  useRestrictTempUsers();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4 md:p-5">
      <SemesterPromotionScreen />
    </div>
  );
}
