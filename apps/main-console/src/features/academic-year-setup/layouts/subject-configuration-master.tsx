import MasterLayout, { NavItem } from "@/components/layouts/MasterLayout";
import { Outlet, useLocation } from "react-router-dom";
import { BookOpen, Link, CheckCircle, XCircle, Calendar } from "lucide-react";

const configurationLinks = [
  {
    title: "Rule 1: - Mandatory Subjects",
    url: "/dashboard/academic-year-setup/subject-configurations",
    icon: BookOpen,
  },
  {
    title: "Rule 2: - Alternative Subjects",
    url: "/dashboard/academic-year-setup/subject-configurations/alternative-subjects",
    icon: Link,
  },
  {
    title: "Rule 3: - Related Subjects Grouping",
    url: "/dashboard/academic-year-setup/subject-configurations/restricted-groupings",
    icon: XCircle,
  },
  {
    title: "Rule 4: - Whitelisted Categories",
    url: "/dashboard/academic-year-setup/subject-configurations/whitelisted-categories",
    icon: CheckCircle,
  },

  {
    title: "Semester Availability",
    url: "/dashboard/academic-year-setup/subject-configurations/semester-availability",
    icon: Calendar,
  },
];

// Note descriptions for each subject configuration page
const pageNotes = {
  "/dashboard/academic-year-setup/subject-configurations": {
    title: "Mandatory Subjects",
    description:
      "Configure mandatory subjects that will be validated during student admission application form submission. Students cannot submit their application if they haven't studied the required mandatory subjects for their chosen program.",
  },
  "/dashboard/academic-year-setup/subject-configurations/program-course-relations": {
    title: "Program-Course Relations",
    description:
      "Define relationships between programs, courses, and subjects. Set prerequisites, core/elective classifications, and class-level requirements for structured academic pathways.",
  },
  "/dashboard/academic-year-setup/subject-configurations/restricted-groupings": {
    title: "Restricted Groupings",
    description:
      "Create restriction rules to prevent certain subject combinations. Useful for avoiding conflicts like scheduling overlaps or mutually exclusive course content.",
  },
  "/dashboard/academic-year-setup/subject-configurations/whitelisted-categories": {
    title: "Whitelisted Categories",
    description:
      "Define approved subject categories that students can choose from. These categories determine which subjects are available for selection in each program.",
  },
  "/dashboard/academic-year-setup/subject-configurations/semester-availability": {
    title: "Semester Availability",
    description:
      "Configure which subjects are available in specific semesters. Set credit limits and availability periods to manage course scheduling and workload distribution.",
  },
};

export default function SubjectConfigurationMaster() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Get the current page note
  const currentPageNote = pageNotes[currentPath as keyof typeof pageNotes];

  const rightBarContent = (
    <div className="flex flex-col gap-4 py-3 px-1 h-full">
      <ul className="flex flex-col gap-2">
        {configurationLinks.map((link) => (
          <NavItem
            key={link.url}
            href={link.url}
            icon={<link.icon />}
            isActive={
              link.url === "/dashboard/academic-year-setup/subject-configurations"
                ? currentPath === link.url
                : currentPath.startsWith(link.url)
            }
          >
            {link.title}
          </NavItem>
        ))}
      </ul>

      {/* Note description above footer */}
      {currentPageNote && (
        <div className="mt-auto mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">{currentPageNote.title}</h4>
                <p className="text-xs text-blue-700 leading-relaxed">{currentPageNote.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MasterLayout rightBarContent={rightBarContent}>
      <Outlet />
    </MasterLayout>
  );
}
