import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

export default function UserProfile() {
  useRestrictTempUsers();
  return <div>UserProfile</div>;
}
