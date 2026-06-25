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
  Flag,
  ShieldCheck,
  Check,
  Clock,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AcademicYearSelector } from "@/components/academic-year";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import CardIllustration, {
  type IllustrationName,
} from "@/features/academic-year-setup/components/CardIllustration";

const ADMISSIONS_BASE = "/dashboard/academic-setup/admissions";

type StepStatus = "done" | "active" | "upcoming";

type ProcessStep = {
  label: string;
  time: string;
  status: StepStatus;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

// NOTE: statuses / times are placeholders — wire them to the real admission
// schedule data once available.
const processSteps: ProcessStep[] = [
  {
    label: "Start Admissions",
    time: "Not scheduled",
    status: "done",
    href: `${ADMISSIONS_BASE}/start`,
    icon: Flag,
  },
  {
    label: "Counselling",
    time: "Not scheduled",
    status: "done",
    href: `${ADMISSIONS_BASE}/counselling`,
    icon: MessagesSquare,
  },
  {
    label: "Admission Applications",
    time: "Not scheduled",
    status: "active",
    href: `${ADMISSIONS_BASE}/application-forms`,
    icon: FileText,
  },
  {
    label: "Merit Listing",
    time: "Not scheduled",
    status: "upcoming",
    href: `${ADMISSIONS_BASE}/merit-listing`,
    icon: Trophy,
    badge: "Round 1",
  },
  {
    label: "Verification",
    time: "Not scheduled",
    status: "upcoming",
    href: `${ADMISSIONS_BASE}/verification`,
    icon: ShieldCheck,
  },
  {
    label: "Data Transfer",
    time: "Not scheduled",
    status: "upcoming",
    href: `${ADMISSIONS_BASE}/admit-students`,
    icon: ArrowRightLeft,
  },
];

const STATUS_RING: Record<StepStatus, string> = {
  done: "border-emerald-500 bg-emerald-500 text-white",
  active: "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100",
  upcoming: "border-gray-300 bg-white text-gray-400",
};
const STATUS_LABEL: Record<StepStatus, string> = {
  done: "Completed",
  active: "In progress",
  upcoming: "Upcoming",
};
const STATUS_LABEL_CLASS: Record<StepStatus, string> = {
  done: "text-emerald-600",
  active: "text-blue-600",
  upcoming: "text-gray-400",
};

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
    description: "Overview and entry point for the admissions process",
    icon: Home,
    href: `${ADMISSIONS_BASE}/home`,
    iconColor: "text-emerald-600",
    items: "Overview",
    illustrationName: "admission-home",
  },
  {
    title: "Admission Master",
    description: "Boards, subjects and board–subject mappings for admissions",
    icon: Library,
    href: `${ADMISSIONS_BASE}/master`,
    iconColor: "text-indigo-600",
    items: "Boards & subjects",
    illustrationName: "admission-master",
  },
  {
    title: "Staff & Management",
    description: "Assign and manage staff handling the admissions workflow",
    icon: Users,
    href: `${ADMISSIONS_BASE}/staff-management`,
    iconColor: "text-amber-600",
    items: "Staff assignment",
    illustrationName: "staff-management",
    illustration: "/academic-setup-illustrations/staff-management.jpg",
  },
  {
    title: "Admission Help & Support Desk",
    description: "Handle applicant queries and support requests during admissions",
    icon: LifeBuoy,
    href: `${ADMISSIONS_BASE}/help-desk`,
    iconColor: "text-sky-600",
    items: "Queries & support",
    illustrationName: "help-desk",
  },
];

export default function AdmissionsPage() {
  useRestrictTempUsers();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Header with academic-year selector */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admissions</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Masters, application forms, merit listing and admitting students
            </p>
          </div>
          <AcademicYearSelector className="w-full sm:w-64" showLabel={false} />
        </div>

        {/* Admission process timeline */}
        <div className="mb-6 overflow-x-auto border-y border-gray-200 py-6 sm:mb-8">
          <div className="relative flex min-w-[820px] justify-between gap-2">
            {/* connector line behind the step nodes (centres of first & last node) */}
            <div className="absolute left-[8.33%] right-[8.33%] top-6 h-0.5 bg-gray-200" />
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.href}
                  onClick={() => navigate(step.href)}
                  className="group relative z-10 flex flex-1 flex-col items-center px-1 text-center"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover:scale-105 ${STATUS_RING[step.status]}`}
                  >
                    {step.status === "done" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-gray-900 sm:text-sm">
                    {step.label}
                  </span>
                  {step.badge && (
                    <span className="mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {step.badge}
                    </span>
                  )}
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock className="h-3 w-3" />
                    {step.time}
                  </span>
                  <span
                    className={`mt-0.5 text-[11px] font-medium ${STATUS_LABEL_CLASS[step.status]}`}
                  >
                    {STATUS_LABEL[step.status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Other admission modules */}
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
