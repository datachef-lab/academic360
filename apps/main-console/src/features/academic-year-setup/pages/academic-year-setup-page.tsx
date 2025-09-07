import { Outlet, useNavigate } from "react-router-dom";
import { BookOpen, Users, Award, Settings, BarChart3, FileText, Shield, Database, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
const academicYears = [
  { value: "2024-25", label: "2024-25", isActive: true },
  { value: "2023-24", label: "2023-24", isActive: false },
  { value: "2022-23", label: "2022-23", isActive: false },
  { value: "2021-22", label: "2021-22", isActive: false },
];

const statsData = [
  { title: "Total Program-Courses", value: "12", icon: BookOpen, color: "bg-blue-500" },
  { title: "Total Subjects", value: "48", icon: FileText, color: "bg-green-500" },
  { title: "Active Eligibility Rules", value: "8", icon: Shield, color: "bg-purple-500" },
  { title: "Merit Criteria Defined", value: "Yes", icon: Award, color: "bg-orange-500" },
  { title: "Ongoing Admissions", value: "156", icon: Users, color: "bg-pink-500" },
];

const featureCards = [
  {
    title: "Course Design",
    description: "Manage Program-Courses, Subject mapping, and curriculum structure",
    icon: BookOpen,
    href: `/dashboard/academic-year-setup/course-design`,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
    status: "Active",
    items: "12 courses",
    illustration: null, // No illustration available
  },
  {
    title: "Admission Board & Stats",
    description: "Analytics and insights for admissions process and performance",
    icon: BarChart3,
    href: "/dashboard/academic-year-setup/admission-stats",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
    status: "Ready",
    items: "5 reports",
    illustration: "/academic-setup-illustrations/admissions.png",
  },
  {
    title: "Eligibility Criteria",
    description: "Define rules and requirements for program eligibility",
    icon: Shield,
    href: "/dashboard/academic-year-setup/eligibility-criteria",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
    status: "Active",
    items: "8 rules",
    illustration: null, // No illustration available
  },
  {
    title: "Merit List Criteria",
    description: "Configure how merit lists are generated and ranked",
    icon: Award,
    href: "/dashboard/academic-year-setup/merit-criteria",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    iconColor: "text-orange-600",
    status: "Complete",
    items: "3 criteria",
    illustration: "/academic-setup-illustrations/merit-list-criteria.png",
  },
  {
    title: "Board & Subjects Master",
    description: "Subject mappings per Board and educational standards",
    icon: Database,
    href: "/dashboard/academic-year-setup/board-subjects",
    color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    status: "Ready",
    items: "15 boards",
    illustration: null, // No illustration available
  },
  {
    title: "Subject Selection Configurations",
    description: "Mandatory subjects, whitelists, restrictions, and semester availability",
    icon: Settings,
    href: "/dashboard/academic-year-setup/subject-configurations",
    color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    iconColor: "text-pink-600",
    status: "Pending",
    items: "0 configured",
    illustration: "/academic-setup-illustrations/subject-selection-config.png",
  },
];

export default function AcademicYearSetupPage() {
  const navigate = useNavigate();

  return (
    <div className=" bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Year Setup</h1>
              <p className="text-gray-600">
                Configure and manage your academic year settings, courses, and admission processes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Academic Year:</span>
                <Select defaultValue="2024-25">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        <div className="flex items-center gap-2">
                          <span>{year.label}</span>
                          {year.isActive && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Tiles */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Quick Stats</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {statsData.map((stat, index) => (
              <Card
                key={index}
                className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group border-0 shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 leading-tight">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Academic Setup Modules</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, index) => (
              <Card
                key={index}
                className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden rounded-xl"
                onClick={() => navigate(card.href)}
              >
                <CardContent className="p-0">
                  {/* Header with Icon and Status */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${card.color.replace("50", "100")} shadow-sm`}>
                        <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          card.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : card.status === "Ready"
                              ? "bg-blue-100 text-blue-700"
                              : card.status === "Complete"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>

                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors mb-2">
                      {card.title}
                    </CardTitle>

                    <p className="text-sm font-medium text-gray-500 mb-3">{card.items}</p>
                  </div>

                  {/* Illustration Section */}
                  <div className="px-6 pb-6">
                    {card.illustration ? (
                      <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                        <img
                          src={card.illustration}
                          alt={`${card.title} illustration`}
                          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                      </div>
                    ) : (
                      <div
                        className={`h-32 rounded-lg ${card.color.replace("50", "100")} flex justify-center items-center relative overflow-hidden`}
                      >
                        <card.icon
                          className={`h-16 w-16 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="px-6 pb-6">
                    <CardDescription className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-500 transition-colors">
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
