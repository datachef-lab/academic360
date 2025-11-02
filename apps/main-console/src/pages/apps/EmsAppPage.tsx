import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function EmsAppPage() {
  useRestrictTempUsers();
  return <div>EmsAppPage</div>;
}
