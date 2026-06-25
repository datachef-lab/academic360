import { useNavigate } from "react-router-dom";
import { Home, Library, Users, LifeBuoy } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import CardIllustration, {
  type IllustrationName,
} from "@/features/academic-year-setup/components/CardIllustration";

const ADMISSIONS_BASE = "/dashboard/academic-setup/admissions";

type AdmissionCard = {
  title: string;
  description: string;
  icon: typeof Home;
  href: string;
  iconColor: string;
  items: string;
  illustrationName: IllustrationName;
  illustration?: string | null;
};

const cards: AdmissionCard[] = [
  {
    title: "Admission Home",
    description: "Entry point and summary of the current admission cycle.",
    icon: Home,
    href: `${ADMISSIONS_BASE}/home`,
    iconColor: "text-emerald-600",
    items: "Overview & summary",
    illustrationName: "admission-home",
  },
  {
    title: "Admission Master",
    description: "Manage boards, subjects and board–subject (paper) mappings used in admissions.",
    icon: Library,
    href: `${ADMISSIONS_BASE}/master`,
    iconColor: "text-indigo-600",
    items: "Boards, subjects & mappings",
    illustrationName: "admission-master",
  },
  {
    title: "Staff & Management",
    description: "Assign staff and manage roles handling the admission workflow.",
    icon: Users,
    href: `${ADMISSIONS_BASE}/staff-management`,
    iconColor: "text-amber-600",
    items: "Staff assignment & roles",
    illustrationName: "staff-management",
    illustration: "/academic-setup-illustrations/staff-management.jpg",
  },
  {
    title: "Admission Help & Support Desk",
    description: "Handle applicant queries and support tickets during admissions.",
    icon: LifeBuoy,
    href: `${ADMISSIONS_BASE}/help-desk`,
    iconColor: "text-sky-600",
    items: "Applicant queries & support",
    illustrationName: "help-desk",
  },
];

export default function AdmissionsPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card
              key={card.href}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-xl"
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
                  <CardIllustration
                    name={card.illustrationName}
                    image={card.illustration ?? undefined}
                    alt={`${card.title} illustration`}
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
    </div>
  );
}
