import MasterLayout from "@/components/layouts/MasterLayout";
import { Outlet } from "react-router-dom";
import { User, Settings, KeyRound, Building2 } from "lucide-react";

const subLinks = [
  { icon: Settings, title: "General", url: "/dashboard/settings" },
  { icon: KeyRound, title: "API Configurations", url: "/dashboard/settings/api-config" },
  { icon: User, title: "Users", url: "/dashboard/settings/users" },
  { icon: Building2, title: "Departments", url: "/dashboard/settings/departments" },
];

export default function SettingsMasterLayoutPage() {
  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
