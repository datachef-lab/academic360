import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import ProtectedRouteWrapper from "@/components/globals/ProtectedRouteWrapper";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { RESOURCE_CONFIGS } from "@/features/academic-year-setup/general/resource-configs";

const GENERAL_BASE = "/dashboard/academic-setup/general";

export default function GeneralMaster() {
  const location = useLocation();
  const currentPath = location.pathname;
  useRestrictTempUsers();

  const rightBarContent = (
    <div className="flex h-full flex-col gap-2 py-3">
      <h3 className="mx-4 mb-1 border-b text-lg font-bold">General Masters</h3>
      <ul>
        {RESOURCE_CONFIGS.map((c) => {
          const href = `${GENERAL_BASE}/${c.key}`;
          const Icon = c.icon;
          const isActive =
            currentPath === href || (c === RESOURCE_CONFIGS[0] && currentPath === GENERAL_BASE);
          return (
            <NavItem key={c.key} href={href} icon={<Icon />} isActive={isActive}>
              {c.title}
            </NavItem>
          );
        })}
      </ul>
    </div>
  );

  return (
    <ProtectedRouteWrapper>
      <MasterLayout subLinks={[]} rightBarContent={rightBarContent}>
        <Outlet />
      </MasterLayout>
    </ProtectedRouteWrapper>
  );
}
