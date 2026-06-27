import { Outlet, useNavigate } from "react-router-dom";
import { Wrench, CreditCard, MonitorPlay, ArrowLeftRight } from "lucide-react";
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
    image:
      "https://thumbs.dreamstime.com/b/id-card-icon-comic-style-identity-badge-vector-cartoon-illustration-pictogram-access-cardholder-people-business-concept-id-card-136144413.jpg",
  },
  {
    title: "Student Console Simulation",
    description:
      "Preview the student-facing console as a chosen student to validate flows end-to-end.",
    icon: MonitorPlay,
    href: "/dashboard/tools/simulation",
    iconColor: "text-indigo-600",
    items: "Console preview",
    image:
      "https://c8.alamy.com/comp/2M676NN/ui-and-ux-design-abstract-concept-vector-illustration-mobile-app-ui-design-website-ux-user-interface-interaction-experience-web-development-menu-2M676NN.jpg",
  },
  {
    title: "Shift Change",
    description:
      "Search a student by UID and change their shift, section, or class roll number (updates UID, login email, and fees).",
    icon: ArrowLeftRight,
    href: "/dashboard/tools/shift-change",
    iconColor: "text-violet-600",
    items: "Student shift / section / roll",
    image:
      "https://img.magnific.com/free-vector/mechanism-teamwork-cartoon-characters-spinning-gears-together-co-working-collaboration-partnership-team-building-cooperation-technology-concept-illustration_335657-2038.jpg",
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

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {toolCards.map((card) => (
            <Card
              key={card.title}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-300 bg-white transition-all duration-300 hover:border-gray-400 hover:shadow-xl"
              onClick={() => navigate(card.href)}
            >
              <CardContent className="flex h-full flex-col p-0">
                {/* Card header */}
                <div className="flex items-center gap-3 border-b border-gray-100 p-4 transition-colors group-hover:bg-gray-50 sm:p-5">
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
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 sm:h-56">
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
