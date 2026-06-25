import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Home,
  Library,
  Users,
  LifeBuoy,
  FileText,
  Trophy,
  ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import CardIllustration, {
  type IllustrationName,
} from "@/features/academic-year-setup/components/CardIllustration";

type AdmissionCard = {
  title: string;
  description: string;
  icon: typeof Home;
  href: string;
  iconColor: string;
  status: "Ready" | "Pending";
  items: string;
  illustrationName: IllustrationName;
  illustration?: string | null;
};

const cards: AdmissionCard[] = [
  {
    title: "Admission Home",
    description: "Overview and entry point for the admissions process",
    icon: Home,
    href: "/dashboard/academic-setup/admissions/home",
    iconColor: "text-emerald-600",
    status: "Pending",
    items: "Overview",
    illustrationName: "admission-home",
  },
  {
    title: "Admission Master",
    description: "Boards, subjects and board–subject mappings for admissions",
    icon: Library,
    href: "/dashboard/academic-setup/admissions/master",
    iconColor: "text-indigo-600",
    status: "Ready",
    items: "Boards & subjects",
    illustrationName: "admission-master",
  },
  {
    title: "Staff & Management",
    description: "Assign and manage staff handling the admissions workflow",
    icon: Users,
    href: "/dashboard/academic-setup/admissions/staff-management",
    iconColor: "text-amber-600",
    status: "Pending",
    items: "Staff assignment",
    illustrationName: "staff-management",
    illustration: "/academic-setup-illustrations/staff-management.jpg",
  },
  {
    title: "Admission Help & Support Desk",
    description: "Handle applicant queries and support requests during admissions",
    icon: LifeBuoy,
    href: "/dashboard/academic-setup/admissions/help-desk",
    iconColor: "text-sky-600",
    status: "Pending",
    items: "Queries & support",
    illustrationName: "help-desk",
  },
  {
    title: "Application Forms",
    description: "Configure and review admission application forms",
    icon: FileText,
    href: "/dashboard/academic-setup/admissions/application-forms",
    iconColor: "text-blue-600",
    status: "Pending",
    items: "Forms",
    illustrationName: "application-forms",
    illustration: "/academic-setup-illustrations/application-forms.jpg",
  },
  {
    title: "Merit Listing",
    description: "Generate and manage merit lists for applicants",
    icon: Trophy,
    href: "/dashboard/academic-setup/admissions/merit-listing",
    iconColor: "text-orange-600",
    status: "Pending",
    items: "Merit lists",
    illustrationName: "merit-listing",
    illustration: "/academic-setup-illustrations/merit-listing.jpg",
  },
  {
    title: "Admit Students / Data Transfer",
    description: "Admit applicants and transfer admitted student data",
    icon: ArrowRightLeft,
    href: "/dashboard/academic-setup/admissions/admit-students",
    iconColor: "text-rose-600",
    status: "Pending",
    items: "Admit & transfer",
    illustrationName: "admit-students",
  },
];

export default function AdmissionsPage() {
  useRestrictTempUsers();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admissions</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Masters, application forms, merit listing and admitting students
          </p>
        </div>

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
                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 sm:h-40">
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
