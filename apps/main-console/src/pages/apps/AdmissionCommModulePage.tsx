import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function AdmissionCommModulePage() {
  useRestrictTempUsers();
  return <div>AdmissionCommModulePage</div>;
}
