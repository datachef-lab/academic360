import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import { BarChart3, IdCard, Layers, LayoutDashboard, ScanLine, Sun } from "lucide-react";
import { isIdCardGuestUser, useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useAuth } from "@/features/auth/hooks/use-auth";

// Staff see the Dashboard (index) + operational pages.
const staffPageLinks = [
  {
    title: "Home",
    url: "/dashboard/tools/id-cards",
    icon: LayoutDashboard,
  },
  {
    title: "Issue / Reissue ID Card",
    url: "/dashboard/tools/id-cards/issue",
    icon: ScanLine,
  },
  {
    title: "Reports",
    url: "/dashboard/tools/id-cards/reports",
    icon: BarChart3,
  },
];

// ID-card guests are locked to the issue page, which lives at the tool index
// (the restricted-users hook only allows them on that exact path).
const guestPageLinks = [
  {
    title: "Issue / Reissue ID Card",
    url: "/dashboard/tools/id-cards",
    icon: ScanLine,
  },
];

const masterLinks = [
  {
    title: "ID Card Templates",
    url: "/dashboard/tools/id-cards/templates",
    icon: IdCard,
  },
  {
    title: "Shifts",
    url: "/dashboard/tools/id-cards/shifts",
    icon: Sun,
  },
  {
    title: "Sections",
    url: "/dashboard/tools/id-cards/sections",
    icon: Layers,
  },
];

const issueNote = {
  title: "Issue / Reissue ID Card",
  description:
    "Search a student by UID or RFID, capture their photo, compose the card from the active template, write/update RFID, and save the issued card to AWS S3 with a permanent audit record.",
};

const pageNotes: Record<string, { title: string; description: string }> = {
  "/dashboard/tools/id-cards": {
    title: "Home",
    description:
      "Live issuance overview — cards issued, drafts pending, print-not-saved backlog, and breakdowns by course, academic year, template and operator. Updates in realtime as cards are issued.",
  },
  "/dashboard/tools/id-cards/issue": issueNote,
  "/dashboard/tools/id-cards/reports": {
    title: "Reports",
    description:
      "Pick an issuance date and download the daily Excel sheet of issued cards or a ZIP of the captured card images.",
  },
  "/dashboard/tools/id-cards/templates": {
    title: "ID Card Templates",
    description:
      "Front-side template master per academic year — upload background, set per-field coordinates, validity dates, and pick the default.",
  },
  "/dashboard/tools/id-cards/shifts": {
    title: "Shifts",
    description: "Shift master used across academic and idcard modules.",
  },
  "/dashboard/tools/id-cards/sections": {
    title: "Sections",
    description: "Section master used across academic and idcard modules.",
  },
};

const isActive = (linkUrl: string, currentPath: string) => {
  if (linkUrl === "/dashboard/tools/id-cards") {
    return currentPath === linkUrl;
  }
  return currentPath.startsWith(linkUrl);
};

export default function ClassesMaster() {
  useRestrictTempUsers();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  // Guests are limited to the issue/reissue page (which they reach at the tool
  // index): show only that link, hide the Dashboard, Reports and all Masters.
  const idCardGuest = isIdCardGuestUser(user?.email);
  const visiblePageLinks = idCardGuest ? guestPageLinks : staffPageLinks;

  const matchedKey = Object.keys(pageNotes)
    .sort((a, b) => b.length - a.length)
    .find((p) => currentPath === p || currentPath.startsWith(`${p}/`));
  // A guest on the index sees the Issue page (via the home gate), so show its note.
  const currentPageNote = idCardGuest ? issueNote : matchedKey ? pageNotes[matchedKey] : undefined;

  const rightBarContent = (
    <div className="flex flex-col gap-3 py-3 px-1 h-full">
      <ul className="flex flex-col gap-1">
        {visiblePageLinks.map((link) => (
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

      {!idCardGuest && (
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
      )}
    </div>
  );

  return (
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
