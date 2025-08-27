import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Users,
  CheckCircle,
  FileText,
  XCircle,
  CreditCard,
  IndianRupee,
  HomeIcon,
  BookCheck,
  BookOpen,
  DollarSign,
  Clock,
  FileCog,
  IdCard,
  Loader2,
} from "lucide-react";
import type { Admission, ApplicationFormDto } from "@/types/admissions";
// import type { AdmissionSummary } from "../types";
import MasterLayout, { LinkType } from "@/components/layouts/MasterLayout";
import { cn } from "@/lib/utils";

const defaultLinks: LinkType[] = [{ icon: HomeIcon, title: "Home", url: "" }];

const configurationLinks: LinkType[] = [
  { icon: CheckCircle, title: "Eligibility Rules", url: "eligibility-rules" },
  { icon: BookCheck, title: "Merit Criteria", url: "merit-criteria" },
  { icon: DollarSign, title: "Fee Slab Mapping", url: "fee-slab-mapping" },
];

const workflowLinks: LinkType[] = [
  {
    icon: FileText,
    title: "Pre-Admission Queries",
    url: "pre-admission-queries",
    status: "completed",
    completedAt: "2024-07-09T13:45:00",
  },
  { icon: Users, title: "Applications", url: "applications", status: "completed", completedAt: "2024-07-09T14:10:00" },
  { icon: BookOpen, title: "Generate Merit", url: "generate-merit", status: "in_progress" },
  { icon: CreditCard, title: "Fee Payment Review", url: "fee-payment-review", status: "not_started" },
  { icon: FileCog, title: "Document Verification", url: "document-verification", status: "not_started" },
  { icon: IdCard, title: "ID Card Generator", url: "id-card-generator", status: "not_started" },
  { icon: CheckCircle, title: "Final Admission Push", url: "final-admission-push", status: "not_started" },
];

function formatDateTime(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
}

const content = (
  <div className="flex flex-col justify-between h-full  gap-4 py-3">
    <div className="">
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm">
        {defaultLinks.map((link) => (
          <NavItem key={link.title} href={link.url} icon={<link.icon className="h-5 w-5 text-[12px]" />}>
            {link.title}
          </NavItem>
        ))}
      </ul>
    </div>
    {/* Admission Workflow Section */}
    <div className="">
      <div className="font-semibold text-gray-700 mb-2 flex items-center">
        <span>📄</span> Admission Workflow
      </div>
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm space-y-1">
        {workflowLinks.map((link) => (
          <NavItem
            key={link.title}
            href={link.url}
            icon={
              link.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : link.status === "in_progress" ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <link.icon className="w-5 h-5 text-gray-400" />
              )
            }
            isActive={link.status === "in_progress"}
          >
            <div className="flex flex-col w-full ">
              <span
                className={
                  link.status === "completed"
                    ? "text-green-700 font-semibold"
                    : link.status === "in_progress"
                      ? "text-blue-700 font-semibold"
                      : "text-gray-400"
                }
              >
                {link.title}
              </span>
              {link.status === "completed" && link.completedAt && (
                <p className="text-xs text-right w-full text-gray-500 ml-2">{formatDateTime(link.completedAt)}</p>
              )}
            </div>
          </NavItem>
        ))}
      </ul>
    </div>
    {/* Configurations Section */}
    <div>
      <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <span>🛠️</span> Configurations
      </div>
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm space-y-1">
        {configurationLinks.map((link) => (
          <NavItem key={link.title} href={link.url} icon={<link.icon className="h-5 w-5 text-[12px]" />}>
            {link.title}
          </NavItem>
        ))}
      </ul>
    </div>
  </div>
);

interface ApplicationFormStats {
  totalApplications: number;
  paymentsDone: number;
  drafts: number;
  submitted: number;
  approved: number;
  rejected: number;
  paymentDue: number;
}

// Dummy data
const dummyAdmission: Admission = {
  id: 1,
  academicYear: {
    id: 1,
    year: "2024",
    isCurrentYear: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-07-10"),
  },
  admissionCode: "ADM2024",
  isClosed: false,
  startDate: new Date("2024-06-01"),
  lastDate: new Date("2024-08-31"),
  isArchived: false,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-07-10"),
  remarks: "Admission process for the academic year 2024-25",
  courses: [],
};

const dummyStats: ApplicationFormStats = {
  totalApplications: 120,
  paymentsDone: 75,
  drafts: 30,
  submitted: 100,
  approved: 80,
  rejected: 20,
  paymentDue: 25,
};

const dummyApplications: ApplicationFormDto[] = [
  {
    id: 1,
    admissionId: 1,
    applicationNumber: "APP001",
    formStatus: "SUBMITTED",
    admissionStep: "SUBMITTED",
    createdAt: new Date("2024-07-01"),
    updatedAt: new Date("2024-07-05"),
    remarks: "Application submitted successfully",
    generalInfo: null,
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 5,
  },
  {
    id: 2,
    admissionId: 1,
    applicationNumber: "APP002",
    formStatus: "APPROVED",
    admissionStep: "SUBMITTED",
    createdAt: new Date("2024-07-02"),
    updatedAt: new Date("2024-07-06"),
    remarks: "Application approved",
    generalInfo: null,
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 5,
  },
  {
    id: 3,
    admissionId: 1,
    applicationNumber: "APP003",
    formStatus: "DRAFT",
    admissionStep: "GENERAL_INFORMATION",
    createdAt: new Date("2024-07-03"),
    updatedAt: new Date("2024-07-03"),
    remarks: "Draft application",
    generalInfo: null,
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 1,
  },
];

export default function AdmissionDetailsPage() {
  const { year } = useParams<{ year: string }>();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [stats, setStats] = useState<ApplicationFormStats>(dummyStats);
  const setApplications = useState<ApplicationFormDto[]>(dummyApplications)[1];
  const [isLoading, setIsLoading] = useState(false);
  // const [searchTerm] = useState("");
  // const [currentPage] = useState(1);
  // const [itemsPerPage] = useState(10);
  const setTotalItems = useState(120)[1];

  // const [filters] = useState({
  //   category: "",
  //   religion: "",
  //   annualIncome: "",
  //   gender: "",
  //   isGujarati: "",
  //   formStatus: "",
  //   course: "",
  //   boardUniversity: "",
  // });

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setAdmission(dummyAdmission);
      setStats(dummyStats);
      setApplications(dummyApplications);
      setTotalItems(120);
      setIsLoading(false);
    }, 500);
  }, [year, setApplications, setTotalItems]);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading admission details...</div>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Admission details not found for year {year}.</div>
      </div>
    );
  }

  return (
    <MasterLayout content={content}>
      <div className="min-h-screen flex justify-center pb-8">
        <div className="rounded-2xl p-3 w-full max-w-6xl">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-8">Admission Dashboard - {year}</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <StatCard
              label="Total Forms"
              value={stats.totalApplications}
              bgColor="bg-blue-50"
              textColor="text-blue-700"
              icon={null}
            />
            <StatCard
              label="Submitted"
              value={stats.submitted}
              bgColor="bg-green-50"
              textColor="text-green-700"
              icon={null}
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              bgColor="bg-green-50"
              textColor="text-green-700"
              icon={null}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              bgColor="bg-red-50"
              textColor="text-red-700"
              icon={<XCircle className="inline w-5 h-5 ml-1 text-red-700" />}
            />
            <StatCard
              label="Payments Done"
              value={stats.paymentsDone}
              bgColor="bg-teal-50"
              textColor="text-teal-700"
              icon={<IndianRupee className="inline w-5 h-5 ml-1 text-teal-700" />}
            />
            <StatCard
              label="Drafts"
              value={stats.drafts}
              bgColor="bg-yellow-50"
              textColor="text-yellow-700"
              icon={<FileText className="inline w-5 h-5 ml-1 text-yellow-700" />}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Table and Actions */}
            <div className="col-span-2 flex flex-col gap-6">
              {/* Applications by Course Table */}
              <div className="bg-white rounded-xl border p-4">
                <h2 className="font-semibold mb-2">Applications by Course</h2>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-gray-500">
                        <th className="text-left py-2">Course</th>
                        <th>Applicants</th>
                        <th>Paid</th>
                        <th>Approved</th>
                        <th>Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { course: "B.Sc (Physics)", applicants: 40, paid: 28, approved: 30 },
                        { course: "B.A. English", applicants: 35, paid: 20, approved: 25 },
                        { course: "B.Com", applicants: 30, paid: 18, approved: 22 },
                        { course: "BBA", applicants: 15, paid: 8, approved: 10 },
                        { course: "B.Sc (Chemistry)", applicants: 25, paid: 15, approved: 18 },
                        { course: "B.Sc (Mathematics)", applicants: 20, paid: 12, approved: 15 },
                        { course: "B.A. History", applicants: 18, paid: 10, approved: 12 },
                        { course: "B.A. Political Science", applicants: 22, paid: 14, approved: 16 },
                        { course: "B.Sc (Biology)", applicants: 28, paid: 18, approved: 20 },
                        { course: "B.A. Economics", applicants: 32, paid: 20, approved: 25 },
                        { course: "B.Sc (Computer Science)", applicants: 45, paid: 30, approved: 35 },
                        { course: "B.A. Sociology", applicants: 15, paid: 8, approved: 10 },
                        { course: "B.Sc (Statistics)", applicants: 12, paid: 6, approved: 8 },
                        { course: "B.A. Geography", applicants: 10, paid: 5, approved: 7 },
                        { course: "B.Sc (Environmental Science)", applicants: 18, paid: 10, approved: 12 },
                        { course: "B.A. Psychology", applicants: 25, paid: 15, approved: 18 },
                        { course: "B.Sc (Microbiology)", applicants: 20, paid: 12, approved: 15 },
                        { course: "B.A. Philosophy", applicants: 8, paid: 4, approved: 6 },
                        { course: "B.Sc (Biotechnology)", applicants: 22, paid: 14, approved: 16 },
                        { course: "B.A. Literature", applicants: 16, paid: 9, approved: 11 },
                        { course: "B.Sc (Physics Honours)", applicants: 12, paid: 7, approved: 9 },
                        { course: "B.A. Journalism", applicants: 14, paid: 8, approved: 10 },
                        { course: "B.Sc (Chemistry Honours)", applicants: 15, paid: 9, approved: 11 },
                        { course: "B.A. Mass Communication", applicants: 18, paid: 10, approved: 12 },
                        { course: "B.Sc (Mathematics Honours)", applicants: 10, paid: 5, approved: 7 },
                        { course: "B.A. Fine Arts", applicants: 12, paid: 6, approved: 8 },
                        { course: "B.Sc (Botany)", applicants: 16, paid: 9, approved: 11 },
                        { course: "B.A. Music", applicants: 8, paid: 4, approved: 6 },
                        { course: "B.Sc (Zoology)", applicants: 14, paid: 8, approved: 10 },
                        { course: "B.A. Dance", applicants: 6, paid: 3, approved: 4 },
                        { course: "B.Sc (Geology)", applicants: 12, paid: 6, approved: 8 },
                        { course: "B.A. Theatre", applicants: 10, paid: 5, approved: 7 },
                        { course: "B.Sc (Oceanography)", applicants: 8, paid: 4, approved: 6 },
                        { course: "B.A. Film Studies", applicants: 14, paid: 8, approved: 10 },
                        { course: "B.Sc (Meteorology)", applicants: 6, paid: 3, approved: 4 },
                        { course: "B.A. Media Studies", applicants: 16, paid: 9, approved: 11 },
                        { course: "B.Sc (Astronomy)", applicants: 4, paid: 2, approved: 3 },
                        { course: "B.A. Creative Writing", applicants: 12, paid: 6, approved: 8 },
                        { course: "B.Sc (Forensic Science)", applicants: 20, paid: 12, approved: 15 },
                        { course: "B.A. Translation Studies", applicants: 8, paid: 4, approved: 6 },
                        { course: "B.Sc (Food Technology)", applicants: 18, paid: 10, approved: 12 },
                        { course: "B.A. Linguistics", applicants: 10, paid: 5, approved: 7 },
                        { course: "B.Sc (Nutrition Science)", applicants: 16, paid: 9, approved: 11 },
                        { course: "B.A. Archaeology", applicants: 6, paid: 3, approved: 4 },
                        { course: "B.Sc (Sports Science)", applicants: 14, paid: 8, approved: 10 },
                        { course: "B.A. Heritage Studies", applicants: 8, paid: 4, approved: 6 },
                      ].map((row) => (
                        <tr key={row.course} className="border-t hover:bg-gray-50">
                          <td className="py-2">{row.course}</td>
                          <td className="text-center py-2">{row.applicants}</td>
                          <td className="text-center py-2">{row.paid}</td>
                          <td className="text-center py-2">{row.approved}</td>
                          <td className="text-center py-2">
                            <button className="text-blue-600 underline hover:text-blue-800">Download</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Side Widgets */}
            <div className="flex flex-col gap-4">
              {/* Approved Pie */}
              {/* <div className="bg-white rounded-xl border p-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">80</span>
                </div>
                <div className="text-sm">Approved</div>
                <div className="text-xs text-gray-500">Rejected: 20</div>
              </div> */}
              {/* Merit Round Summary */}
              <div className="bg-white rounded-xl border p-4">
                <h4 className="font-semibold mb-1">Merit Round Summary</h4>
                <ul className="text-sm list-disc ml-5">
                  <li>Seats Allotted: 60</li>
                  <li>Waitlisted: 15</li>
                </ul>
              </div>
              {/* Next Deadline */}
              <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-gray-500" />
                <div>
                  <div className="font-semibold text-sm">Next-Deadline</div>
                  <div className="text-xs text-gray-500">
                    Document Submission
                    <br />
                    July 25, 2024
                  </div>
                </div>
              </div>
              {/* Staff Assignment */}
              <Link to={`staff-assignment`} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-gray-500" />
                <span className="font-semibold">Staff Assignment</span>
              </Link>
              {/* Actions */}
              <div className="flex gap-4 mt-2">
                <button className="border rounded-lg px-6 py-2 font-medium">Download Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}

const StatCard = ({
  label,
  value,
  icon,
  bgColor = "bg-white",
  textColor = "text-gray-900",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor?: string;
  textColor?: string;
}) => (
  <div className={`${bgColor} p-5 rounded-lg shadow border border-gray-200 flex items-center justify-between`}>
    <div>
      <div className={`text-sm font-medium ${textColor} mb-2`}>{label}</div>
      <div className={`text-3xl font-bold ${textColor}`}>{value.toLocaleString()}</div>
    </div>
    {icon}
  </div>
);

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

export function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        to={href}
        className={cn(
          "flex items-center gap-3 px-3 py-1 rounded-md font-medium transition-colors",
          isActive ? "bg-purple-100 text-purple-700 shadow-sm" : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <span className={cn("h-5 w-5 flex-shrink-0 text-[12px]", isActive ? "text-purple-600" : "text-gray-500")}>
          {icon}
        </span>
        <div className="flex-1 min-w-0 text-[12px]">{children}</div>
      </Link>
    </li>
  );
}
