import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import { BarChart3, IdCard, Layers, ScanLine, Sun } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const pageLinks = [
  {
    title: "Issue / Reissue ID Card",
    url: "/dashboard/academic-year-setup/classes",
    icon: ScanLine,
  },
  {
    title: "Reports",
    url: "/dashboard/academic-year-setup/classes/reports",
    icon: BarChart3,
  },
];

const masterLinks = [
  {
    title: "ID Card Templates",
    url: "/dashboard/academic-year-setup/classes/templates",
    icon: IdCard,
  },
  {
    title: "Shifts",
    url: "/dashboard/academic-year-setup/classes/shifts",
    icon: Sun,
  },
  {
    title: "Sections",
    url: "/dashboard/academic-year-setup/classes/sections",
    icon: Layers,
  },
];

const pageNotes: Record<string, { title: string; description: string }> = {
  "/dashboard/academic-year-setup/classes": {
    title: "Issue / Reissue ID Card",
    description:
      "Search a student by UID or RFID, capture their photo, compose the card from the active template, write/update RFID, and save the issued card to AWS S3 with a permanent audit record.",
  },
  "/dashboard/academic-year-setup/classes/reports": {
    title: "Reports",
    description:
      "Pick an issuance date and download the daily Excel sheet of issued cards or a ZIP of the captured card images.",
  },
  "/dashboard/academic-year-setup/classes/templates": {
    title: "ID Card Templates",
    description:
      "Front-side template master per academic year — upload background, set per-field coordinates, validity dates, and pick the default.",
  },
  "/dashboard/academic-year-setup/classes/shifts": {
    title: "Shifts",
    description: "Shift master used across academic and idcard modules.",
  },
  "/dashboard/academic-year-setup/classes/sections": {
    title: "Sections",
    description: "Section master used across academic and idcard modules.",
  },
};

const isActive = (linkUrl: string, currentPath: string) => {
  if (linkUrl === "/dashboard/academic-year-setup/classes") {
    return currentPath === linkUrl;
  }
  return currentPath.startsWith(linkUrl);
};

export default function ClassesMaster() {
  useRestrictTempUsers();
  const location = useLocation();
  const currentPath = location.pathname;

  const matchedKey = Object.keys(pageNotes)
    .sort((a, b) => b.length - a.length)
    .find((p) => currentPath === p || currentPath.startsWith(`${p}/`));
  const currentPageNote = matchedKey ? pageNotes[matchedKey] : undefined;

  const rightBarContent = (
    <div className="flex flex-col gap-3 py-3 px-1 h-full">
      <ul className="flex flex-col gap-1">
        {pageLinks.map((link) => (
          <NavItem
            key={link.url}
            href={link.url}
            icon={<link.icon />}
            isActive={isActive(link.url, currentPath)}
          >
            {link.title}
          </NavItem>
        ))}
      </ul>

      {currentPageNote && (
        <div className="mt-2">
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-md">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-violet-900 text-sm mb-1">
                  {currentPageNote.title}
                </h4>
                <p className="text-xs text-violet-700 leading-relaxed">
                  {currentPageNote.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto px-3 pt-3 pb-4 border-t">
        <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mb-1">
          Masters
        </div>
        <ul className="flex flex-col gap-1">
          {masterLinks.map((link) => (
            <NavItem
              key={link.url}
              href={link.url}
              icon={<link.icon />}
              isActive={isActive(link.url, currentPath)}
            >
              {link.title}
            </NavItem>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
