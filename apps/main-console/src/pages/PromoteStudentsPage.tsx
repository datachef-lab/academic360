import { SemesterPromotionScreen } from "@/features/promote-students";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function PromoteStudentsPage() {
  useRestrictTempUsers();

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
      <SemesterPromotionScreen />
    </div>
  );
}
