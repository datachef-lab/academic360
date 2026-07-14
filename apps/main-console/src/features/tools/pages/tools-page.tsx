import { Outlet, useNavigate } from "react-router-dom";
import {
  Wrench,
  CreditCard,
  MonitorPlay,
  ArrowLeftRight,
  Activity,
  GraduationCap,
  Layers,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type ToolCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof CreditCard;
  iconColor: string;
  items: string;
  image: string;
};

const toolCards: ToolCard[] = [
  {
    title: "ID Cards",
    description:
      "Issue / reissue ID cards, manage card templates, shifts, sections, and download daily reports.",
    icon: CreditCard,
    href: "/dashboard/tools/id-cards",
    iconColor: "text-rose-600",
    items: "ID card module",
    image: "/tool-illustrations/idcards.jpg",
  },
  {
    title: "Student Console Simulation",
    description:
      "Preview the student-facing console as a chosen student to validate flows end-to-end.",
    icon: MonitorPlay,
    href: "/dashboard/tools/simulation",
    iconColor: "text-indigo-600",
    items: "Console preview",
    image: "/tool-illustrations/simulation.jpg",
  },
  {
    title: "Real Time Tracker",
    description: "Live tracking of academic activity and events across the console in real time.",
    icon: Activity,
    href: "/dashboard/tools/realtime-tracker",
    iconColor: "text-cyan-600",
    items: "Live activity tracker",
    image: "/tool-illustrations/realtime-tracker.jpg",
  },
  {
    title: "Promote Students",
    description:
      "Promote students to the next class / semester based on the configured promotion logic.",
    icon: GraduationCap,
    href: "/dashboard/tools/promote-students",
    iconColor: "text-emerald-600",
    items: "Class / semester promotion",
    image: "/tool-illustrations/promote-students.jpg",
  },
  {
    title: "Bulk Data Upload",
    description: "Upload data in bulk via spreadsheets to seed or update records across modules.",
    icon: Layers,
    href: "/dashboard/tools/bulk-upload",
    iconColor: "text-amber-600",
    items: "Spreadsheet imports",
    image: "/tool-illustrations/bulk-upload.png",
  },
  {
    title: "Shift Change",
    description:
      "Search a student by UID and change their shift, section, or class roll number (updates UID, login email, and fees).",
    icon: ArrowLeftRight,
    href: "/dashboard/tools/shift-change",
    iconColor: "text-violet-600",
    items: "Student shift / section / roll",
    image: "/tool-illustrations/shift-change.jpg",
  },
  {
    title: "Notifications",
    description:
      "Compose and send notices, emails, SMS and WhatsApp messages to students and staff.",
    icon: Bell,
    href: "/dashboard/tools/notifications",
    iconColor: "text-rose-600",
    items: "Notices & alerts",
    image: "/academic-setup-illustrations/notifications.jpg",
  },
];

export default function ToolsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-blue-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tools</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Utilities that sit alongside the academic and admin modules.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {toolCards.map((card) => (
            <Card
              key={card.title}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-300 bg-white transition-all duration-300 hover:border-gray-400 hover:shadow-xl"
              onClick={() => navigate(card.href)}
            >
              <CardContent className="flex h-full flex-col p-0">
                {/* Card header */}
                <div className="flex items-center gap-3 border-b border-gray-200 p-4 transition-colors group-hover:bg-gray-50 sm:p-5">
                  <div className="shrink-0 rounded-lg bg-gray-100 p-2 shadow-sm">
                    <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-gray-700 sm:text-lg">
                      {card.title}
                    </CardTitle>
                    <p className="truncate text-xs font-medium text-gray-500">{card.items}</p>
                  </div>
                </div>

                {/* Illustration with description revealed on hover */}
                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 sm:h-44 lg:h-56">
                  <card.icon className="absolute inset-0 m-auto h-16 w-16 text-gray-200" />
                  <img
                    src={card.image}
                    alt={`${card.title} illustration`}
                    loading="lazy"
                    className="relative h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs leading-relaxed text-white sm:text-sm">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
