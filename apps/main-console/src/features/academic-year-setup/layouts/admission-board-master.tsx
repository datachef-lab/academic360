import { Outlet } from "react-router-dom";
import MasterLayout from "@/components/layouts/MasterLayout";

export default function AdmissionBoardMaster() {
  return (
    <MasterLayout>
      <Outlet />
    </MasterLayout>
  );
}
