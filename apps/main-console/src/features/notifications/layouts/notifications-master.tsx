import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import { Bell, Home, LayoutTemplate, Zap, CalendarClock } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const BASE = "/dashboard/tools/notifications";

const pageLinks = [
  {
    title: "Home",
    url: BASE,
    icon: Home,
  },
  {
    title: "Automated Notifications",
    url: `${BASE}/automated`,
    icon: Zap,
  },
  {
    title: "Notification Events",
    url: `${BASE}/events`,
    icon: CalendarClock,
  },
];

const masterLinks = [
  {
    title: "Notification Masters",
    url: `${BASE}/masters`,
    icon: LayoutTemplate,
  },
];

const pageNotes: Record<string, { title: string; description: string }> = {
  [BASE]: {
    title: "Notifications Home",
    description:
      "Overview of the notification pipeline — totals by status and channel, plus the most recent notifications triggered across the system.",
  },
  [`${BASE}/automated`]: {
    title: "Automated Notifications",
    description:
      "Every notification triggered by the system (OTP, fee receipts, CU registration, subject selection, exams and more) with its channel, recipient and delivery status.",
  },
  [`${BASE}/events`]: {
    title: "Notification Events",
    description:
      "Named notification events / campaigns — creation and manual triggering will be configured here.",
  },
  [`${BASE}/masters`]: {
    title: "Notification Masters",
    description:
      "The configured notification templates — channel, provider template key, placeholder fields and active status.",
  },
};

const isActive = (linkUrl: string, currentPath: string) => {
  if (linkUrl === BASE) return currentPath === linkUrl;
  return currentPath.startsWith(linkUrl);
};

export default function NotificationsMaster() {
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
              <Bell className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
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
