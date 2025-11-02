import MasterLayout, { LinkType } from "@/components/layouts/MasterLayout";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { BarChart2, FilePlus, HomeIcon } from "lucide-react";
import { Outlet } from "react-router-dom";
// import React from 'react'

const subLinks: LinkType[] = [
  { icon: HomeIcon, title: "Home", url: "/dashboard/marksheets" },
  {
    title: "Add Marksheet",
    url: "/dashboard/marksheets/add",
    icon: FilePlus,
  },
  {
    title: "Reports",
    url: "/dashboard/marksheets/reports",
    icon: BarChart2,
  },
];

export default function MarksheetMaster() {
  useRestrictTempUsers();

  return (
    <MasterLayout subLinks={subLinks}>
      <Outlet />
    </MasterLayout>
  );
}
