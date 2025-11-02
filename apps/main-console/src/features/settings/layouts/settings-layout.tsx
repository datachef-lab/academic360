import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";
import { User, Settings, KeyRound } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const subLinks = [
  { icon: Settings, title: "General", url: "/dashboard/settings" },
  { icon: KeyRound, title: "API Configurations", url: "/dashboard/settings/api-config" },
  { icon: User, title: "Users", url: "/dashboard/settings/users" },
  //   { icon: Building2, title: "Departments", url: "/dashboard/settings/departments" },
];

export default function SettingsMasterLayoutPage() {
  useRestrictTempUsers();
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
