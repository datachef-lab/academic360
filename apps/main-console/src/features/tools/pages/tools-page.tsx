import { Outlet, useNavigate } from "react-router-dom";
import { Wrench, CreditCard, MonitorPlay, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type ToolCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof CreditCard;
  color: string;
  iconColor: string;
  status: string;
  items: string;
};

const toolCards: ToolCard[] = [
  {
    title: "ID Cards",
    description:
      "Issue / reissue ID cards, manage card templates, shifts, sections, and download daily reports.",
    icon: CreditCard,
    href: "/dashboard/tools/id-cards",
    color: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    iconColor: "text-rose-600",
    status: "Ready",
    items: "ID card module",
  },
  {
    title: "Student Console Simulation",
    description:
      "Preview the student-facing console as a chosen student to validate flows end-to-end.",
    icon: MonitorPlay,
    href: "/dashboard/tools/simulation",
    color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    status: "Ready",
    items: "Console preview",
  },
  {
    title: "Shift Change",
    description:
      "Search a student by UID and change their shift, section, or class roll number (updates UID, login email, and fees).",
    icon: ArrowLeftRight,
    href: "/dashboard/tools/shift-change",
    color: "bg-violet-50 border-violet-200 hover:bg-violet-100",
    iconColor: "text-violet-600",
    status: "Ready",
    items: "Student shift / section / roll",
  },
];

export default function ToolsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {toolCards.map((card) => (
            <Card
              key={card.title}
              className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden rounded-xl"
              onClick={() => navigate(card.href)}
            >
              <CardContent className="p-0">
                <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div
                      className={`p-2 sm:p-3 rounded-lg ${card.color.replace("50", "100")} shadow-sm`}
                    >
                      <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                    </div>
                    <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {card.status}
                    </span>
                  </div>

                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors mb-2">
                    {card.title}
                  </CardTitle>

                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">
                    {card.items}
                  </p>
                </div>

                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div
                    className={`h-24 sm:h-32 rounded-lg ${card.color.replace("50", "100")} flex justify-center items-center relative overflow-hidden`}
                  >
                    <card.icon
                      className={`h-12 w-12 sm:h-16 sm:w-16 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                  </div>
                </div>

                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <CardDescription className="text-xs sm:text-sm text-gray-600 leading-relaxed group-hover:text-gray-500 transition-colors">
                    {card.description}
                  </CardDescription>
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
