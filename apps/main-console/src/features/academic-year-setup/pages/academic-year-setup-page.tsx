import { Outlet, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, SlidersHorizontal, Workflow, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { AcademicYearSelector } from "@/components/academic-year";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import CardIllustration, {
  type IllustrationName,
} from "@/features/academic-year-setup/components/CardIllustration";

type FeatureCard = {
  title: string;
  description: string;
  icon: typeof BookOpen;
  href: string;
  iconColor: string;
  status: "Active" | "Ready" | "Complete" | "Pending";
  items: string;
  illustrationName: IllustrationName;
  /** Optional real image; overrides the themed SVG when provided. */
  illustration?: string | null;
};

const featureCards: FeatureCard[] = [
  {
    title: "Course Design",
    description: "Manage Program-Courses, subject mapping, and curriculum structure",
    icon: BookOpen,
    href: "/dashboard/academic-setup/course-design",
    iconColor: "text-blue-600",
    status: "Active",
    items: "Program-courses & subjects",
    illustrationName: "course-design",
    illustration: null,
  },
  {
    title: "Admissions",
    description: "Admission masters, application forms, merit listing and admitting students",
    icon: GraduationCap,
    href: "/dashboard/academic-setup/admissions",
    iconColor: "text-emerald-600",
    status: "Ready",
    items: "Boards, forms, merit & more",
    illustrationName: "admissions",
    illustration: null,
  },
  {
    title: "Subject-selection Configuration",
    description: "Subject-selection metas, related subjects, restricted groupings and rules",
    icon: SlidersHorizontal,
    href: "/dashboard/academic-setup/subject-configurations",
    iconColor: "text-pink-600",
    status: "Pending",
    items: "Minor / IDC / AEC / CVAC",
    illustrationName: "subject-selection",
    illustration: null,
  },
  {
    title: "Student Promotion Logic Builder",
    description: "Define promotion clauses and builder rules for class progression",
    icon: Workflow,
    href: "/dashboard/academic-setup/student-promotion-logic",
    iconColor: "text-violet-600",
    status: "Ready",
    items: "Promotion rules",
    illustrationName: "promotion-logic",
    illustration: null,
  },
];

export default function AcademicYearSetupPage() {
  useRestrictTempUsers();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Academic Setup</h1>
              <p className="text-sm text-gray-600 sm:text-base">
                Configure and manage courses, admissions, subject selection and promotion logic
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AcademicYearSelector className="w-full sm:w-64" showLabel={false} />
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex items-center gap-2 sm:mb-6">
            <Settings className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6" />
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Academic Setup Modules
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <Card
                key={card.href}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-xl"
                onClick={() => navigate(card.href)}
              >
                <CardContent className="p-0">
                  <div className="p-4 pb-3 sm:p-6 sm:pb-4">
                    <div className="mb-3 flex items-start sm:mb-4">
                      <div className="rounded-lg bg-gray-100 p-2 shadow-sm sm:p-3">
                        <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                    <CardTitle className="mb-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-gray-700 sm:text-lg">
                      {card.title}
                    </CardTitle>
                    <p className="mb-2 text-xs font-medium text-gray-500 sm:mb-3 sm:text-sm">
                      {card.items}
                    </p>
                  </div>

                  <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="h-24 overflow-hidden rounded-lg sm:h-32">
                      <CardIllustration
                        name={card.illustrationName}
                        image={card.illustration ?? undefined}
                        alt={`${card.title} illustration`}
                      />
                    </div>
                  </div>

                  <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <CardDescription className="text-xs leading-relaxed text-gray-600 transition-colors group-hover:text-gray-500 sm:text-sm">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
}
