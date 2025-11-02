import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function EventGatekeeperPage() {
  useRestrictTempUsers();
  return <div>EventGatekeeperPage</div>;
}
