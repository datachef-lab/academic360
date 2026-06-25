import { Outlet, useNavigate } from "react-router-dom";
import {
  GraduationCap,
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
import { AcademicYearSelector } from "@/components/academic-year";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const ADMISSIONS_BASE = "/dashboard/academic-setup/admissions";

type StepStatus = "done" | "active" | "upcoming";

type ProcessStep = {
  label: string;
  time: string;
  status: StepStatus;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Real illustration for the node; falls back to the icon when absent. */
  image?: string;
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
    image: "/academic-setup-illustrations/application-forms.jpg",
  },
  {
    label: "Merit Listing",
    time: "Not scheduled",
    status: "upcoming",
    href: `${ADMISSIONS_BASE}/merit-listing`,
    icon: Trophy,
    badge: "Round 1",
    image: "/academic-setup-illustrations/merit-listing.jpg",
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

export default function AdmissionLayout() {
  useRestrictTempUsers();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Persistent admissions header + process timeline */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="overflow-x-auto border-y border-gray-200 py-6">
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
                    className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 shadow-sm transition-transform group-hover:scale-105 ${STATUS_RING[step.status]}`}
                  >
                    {step.image ? (
                      <img src={step.image} alt="" className="h-full w-full object-cover" />
                    ) : step.status === "done" ? (
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
      </div>

      <Outlet />
    </div>
  );
}
