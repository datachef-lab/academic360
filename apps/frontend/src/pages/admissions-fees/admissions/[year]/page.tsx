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
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { ApplicationFormProvider } from "../components/ApplicationFormProvider";
import type { Admission, ApplicationFormDto } from "@/types/admissions";
import type { AdmissionSummary } from "../types";
// import AdmissionForm from ".components/AdmissionForm";
import {
  fetchAdmissionSummaries,
  findAdmissionById,
} from "@/services/admissions.service";
import axios from "axios";
import MasterLayout, { LinkType } from "@/components/layouts/MasterLayout";
import { cn } from "@/lib/utils";

const defaultLinks: LinkType[] = [
  { icon: HomeIcon, title: "Home", url: "" },
  ];

const configurationLinks: LinkType[] = [
  // { icon: GraduationCap, title: "Mapped Courses", url: "mapped-courses" },
  // { icon: Landmark, title: "Seat Matrix", url: "seat-matrix" },
  { icon: CheckCircle, title: "Eligibility Rules", url: "eligibility-rules" },
  { icon: BookCheck, title: "Merit Criteria", url: "merit-criteria" },
  { icon: DollarSign, title: "Fee Slab Mapping", url: "fee-slab-mapping" },
  // { icon: ClipboardList, title: "Form Settings", url: "form-settings" },
  // { icon: Clock, title: "Important Dates", url: "important-dates" },
];

const workflowLinks: LinkType[] = [
  { icon: FileText, title: "Pre-Admission Queries", url: "pre-admission-queries", status: "completed", completedAt: "2024-07-09T13:45:00" },
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
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// const workflowSteps = [
//   { title: "Applications", status: "completed" },
//   { title: "Eligibility Filter", status: "completed" },
//   { title: "Generate Merit", status: "in_progress" },
//   { title: "Fee Payment Review", status: "not_started" },
//   { title: "Document Verification", status: "not_started" },
//   { title: "ID Card Generator", status: "not_started" },
//   { title: "Pending", status: "not_started" },
// ];

const content = (
  <div className="flex flex-col gap-4 py-3">
    <div>
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm">
        {defaultLinks.map((link) => (
          <NavItem key={link.title} href={link.url} icon={<link.icon className="h-5 w-5" />}>{link.title}</NavItem>
        ))}
      </ul>
    </div>
    {/* Admission Workflow Section */}
    <div>
      <div className="font-semibold text-gray-700 mb-2 flex items-center">
        <span>📄</span> Admission Workflow
      </div>
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm">
        {workflowLinks.map((link) => (
          <NavItem
            key={link.title}
            href={link.url}
            icon={
              link.status === "completed" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
              link.status === "in_progress" ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> :
              <link.icon className="w-5 h-5 text-gray-400" />
            }
            isActive={link.status === "in_progress"}
          >
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
              <span className="block text-xs text-gray-500 ml-7">
                {formatDateTime(link.completedAt)}
              </span>
            )}
          </NavItem>
        ))}
      </ul>
    </div>
    {/* Configurations Section */}
    <div>
      <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <span>🛠️</span> Configurations
      </div>
      <ul className="bg-white rounded-lg px-3 flex flex-col shadow-sm">
        {configurationLinks.map((link) => (
          <NavItem key={link.title} href={link.url} icon={<link.icon className="h-5 w-5" />}>{link.title}</NavItem>
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

export default function AdmissionDetailsPage() {
  const { year } = useParams<{ year: string }>();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const defaultStats: ApplicationFormStats = {
    totalApplications: 0,
    paymentsDone: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    paymentDue: 0,
  };
  const setStats = useState<ApplicationFormStats>(defaultStats)[1];
  const setApplications = useState<ApplicationFormDto[]>([])[1];
  const [isLoading, setIsLoading] = useState(true); 
  const [searchTerm] = useState("");
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const setTotalItems = useState(0)[1];
  // const [selectedRows, setSelectedRows] = useState<number[]>([]);
  // const [selectAll, setSelectAll] = useState(false);
  // const setIsFilterOpen = useState(false)[1];
  // const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);

  const [filters] = useState({
    category: "",
    religion: "",
    annualIncome: "",
    gender: "",
    isGujarati: "",
    formStatus: "",
    course: "",
    boardUniversity: "",
  });

  // const setTempFilters = useState(filters)[1];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let admissionData = null;
      if (year) {
        const summaries: AdmissionSummary[] = await fetchAdmissionSummaries();
        const found = summaries.find(
          (a) => String(a.admissionYear) === String(year)
        );
        if (found && found.id) {
          const admissionId = Number(found.id);
          admissionData = await findAdmissionById(admissionId);
          setAdmission(admissionData.payload);
          // Build query params for pagination, search, and filters
          const params = {
            page: currentPage,
            size: itemsPerPage,
            search: searchTerm,
            ...filters,
          };
          const res = await axios.get(`/api/admissions/${year}/applications`, { params });
          const data = res.data;
          if (data && data.status === 'SUCCESS' && data.data) {
            setApplications(data.data.applications || []);
            setStats({
              totalApplications: data.data.totalItems ?? 0,
              paymentsDone: data.data.stats?.paymentsDone ?? 0,
              drafts: data.data.stats?.drafts ?? 0,
              submitted: data.data.stats?.submitted ?? 0,
              approved: data.data.stats?.approved ?? 0,
              rejected: data.data.stats?.rejected ?? 0,
              paymentDue: data.data.stats?.paymentDue ?? 0,
            });
            setTotalItems(data.data.totalItems ?? 0);
          } else {
            setApplications([]);
            setStats(defaultStats);
            setTotalItems(0);
          }
        } else {
          setAdmission(null);
          setApplications([]);
          setStats(defaultStats);
          setTotalItems(0);
        }
      }
    } catch (err) {
      setAdmission(null);
      setApplications([]);
      setStats(defaultStats);
      setTotalItems(0);
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [year, currentPage, itemsPerPage, searchTerm, filters]);

  // const handleFilterChange = (field: string, value: string) => {
  //   setTempFilters((prev) => ({ ...prev, [field]: value === "all" ? "" : value }));
  // };

  // const applyFilters = () => {
  //   setFilters(tempFilters);
  //   setCurrentPage(1);
  //   fetchData();
  //   setIsFilterOpen(false);
  // };

  // const clearFilters = () => {
  //   const emptyFilters = {
  //     category: "",
  //     religion: "",
  //     annualIncome: "",
  //     gender: "",
  //     isGujarati: "",
  //     formStatus: "",
  //     course: "",
  //     boardUniversity: "",
  //   };
  //   setTempFilters(emptyFilters);
  //   setFilters(emptyFilters);
  //   setCurrentPage(1);
  // };

  // const handlePageChange = (page: number) => {
  //   setCurrentPage(page);
  // };

  // const totalPages = Math.ceil(totalItems / itemsPerPage);

  // const getPageNumbers = () => {
  //   const pages = [];
  //   const maxVisiblePages = 5;

  //   if (totalPages <= maxVisiblePages) {
  //     for (let i = 1; i <= totalPages; i++) pages.push(i);
  //   } else {
  //     if (currentPage <= 3) {
  //       for (let i = 1; i <= 4; i++) pages.push(i);
  //       pages.push("...");
  //       pages.push(totalPages);
  //     } else if (currentPage >= totalPages - 2) {
  //       pages.push(1);
  //       pages.push("...");
  //       for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  //     } else {
  //       pages.push(1);
  //       pages.push("...");
  //       for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
  //       pages.push("...");
  //       pages.push(totalPages);
  //     }
  //   }
  //   return pages;
  // };

  // const handleRowSelect = (id: number | undefined) => {
  //   if (typeof id !== 'number') return;
  //   setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  // };

  // const handleSelectAll = () => {
  //   if (selectAll) {
  //     setSelectedRows([]);
  //   } else {
  //     setSelectedRows(applications.map((app) => (app as ApplicationFormDto).id).filter((id): id is number => typeof id === 'number'));
  //   }
  //   setSelectAll(!selectAll);
  // };

  // const handleBulkAction = async (action: string) => {
  //   if (selectedRows.length === 0) {
  //     alert("Please select at least one application");
  //     return;
  //   }
  //   console.log(`Performing ${action} on`, selectedRows);
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   alert(`Successfully ${action.toLowerCase()}ed selected applications`);
  //   setSelectedRows([]);
  //   setSelectAll(false);
  //   fetchData();
  // };

  // const getActiveFilterCount = () => {
  //   return Object.values(filters).filter((value) => value !== "" && value !== "all").length;
  // };

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

  // const formStatusOptions = ["DRAFT", "PAYMENT_DUE", "PAYMENT_SUCCESS", "SUBMITTED", "APPROVED", "REJECTED"];
  // const genderOptions = ["MALE", "FEMALE", "TRANSGENDER"];
  // const categoryOptions = ["General", "OBC", "SC", "ST"];
  // const religionOptions = ["Hinduism", "Muslim", "Christian", "Sikh"];
  // const annualIncomeOptions = ["Below 2 LPA", "2-5 LPA", "5-10 LPA", "Above 10 LPA"];
  // const courseOptions = ["B.Tech", "M.Tech", "MBA", "BBA", "BCA"];
  // const boardUniversityOptions = ["CBSE", "ICSE", "State Board", "Gujarat University", "Other"];

  return (
    <MasterLayout content={content}>
      <div className="min-h-screen flex justify-center pb-8">
        <div className="rounded-2xl p-3 w-full max-w-6xl">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-8">Admission Dashboard – 2024</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Forms" value={120} bgColor="bg-blue-50" textColor="text-blue-700" icon={null} />
            <StatCard label="Submitted" value={100} bgColor="bg-green-50" textColor="text-green-700" icon={null} />
            <StatCard label="Approved" value={80} bgColor="bg-green-50" textColor="text-green-700" icon={null} />
            <StatCard label="Rejected" value={20} bgColor="bg-red-50" textColor="text-red-700" icon={<XCircle className="inline w-5 h-5 ml-1 text-red-700" />} />
            <StatCard label="Payments Done" value={75} bgColor="bg-teal-50" textColor="text-teal-700" icon={<IndianRupee className="inline w-5 h-5 ml-1 text-teal-700" />} />
            <StatCard label="Drafts" value={30} bgColor="bg-yellow-50" textColor="text-yellow-700" icon={<FileText className="inline w-5 h-5 ml-1 text-yellow-700" />} />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Table and Actions */}
            <div className="col-span-2 flex flex-col gap-6">
              {/* Applications by Course Table */}
              <div className="bg-white rounded-xl border p-4">
                <h2 className="font-semibold mb-2">Applications by Course</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left">Course</th>
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
                    ].map((row) => (
                      <tr key={row.course} className="border-t">
                        <td>{row.course}</td>
                        <td className="text-center">{row.applicants}</td>
                        <td className="text-center">{row.paid}</td>
                        <td className="text-center">{row.approved}</td>
                        <td className="text-center">
                          <button className="text-blue-600 underline">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Actions */}
              <div className="flex gap-4 mt-2">
                <button className="border rounded-lg px-6 py-2 font-medium">Download Report</button>
                <button className="border rounded-lg px-6 py-2 font-medium flex items-center gap-2">
                  <Users className="w-5 h-5" /> Staff Assignment
                </button>
              </div>
            </div>

            {/* Right: Side Widgets */}
            <div className="flex flex-col gap-4">
              {/* Approved Pie */}
              <div className="bg-white rounded-xl border p-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                  
                  <span className="text-2xl font-bold">80</span>
                </div>
                <div className="text-sm">Approved</div>
                <div className="text-xs text-gray-500">Rejected: 20</div>
              </div>
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
                  <div className="text-xs text-gray-500">Document Submission<br />July 25, 2024</div>
                </div>
              </div>
              {/* Staff Assignment */}
              <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-gray-500" />
                <span className="font-semibold">Staff Assignment</span>
              </div>
              {/* Admission Workflow */}
              {/* <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-3">Admission Workflow</h3>
                <ul className="space-y-2">
                  {workflowSteps.map((step) => (
                    <li key={step.title} className="flex items-center gap-2">
                      <span className={
                        step.status === "completed"
                          ? "text-green-500"
                          : step.status === "in_progress"
                          ? "text-blue-500 animate-spin"
                          : "text-gray-400"
                      }>
                        {step.status === "completed" && <CheckCircle className="w-4 h-4" />}
                        {step.status === "in_progress" && <Loader2 className="w-4 h-4" />}
                        {step.status === "not_started" && <Clock className="w-4 h-4" />}
                      </span>
                      <span
                        className={
                          step.status === "completed"
                            ? "text-green-700 font-semibold"
                            : step.status === "in_progress"
                            ? "text-blue-700 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {step.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div> */}
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

// const FilterSelect = ({
//   label,
//   options,
//   value,
//   onChange,
// }: {
//   label: string;
//   options: string[];
//   value: string;
//   onChange: (value: string) => void;
// }) => {
//   const displayValue = value || "all";
//   return (
//     <div className="w-full">
//       <Label className="block text-sm font-medium text-gray-700 mb-2">{label}</Label>
//       <Select value={displayValue} onValueChange={onChange}>
//         <SelectTrigger className="w-full">
//           <SelectValue placeholder="All" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="all">All</SelectItem>
//           {options.map((option) => (
//             <SelectItem key={option} value={option}>
//               {label === "Is Gujarati" ? (option === "true" ? "Yes" : option === "false" ? "No" : "All") : option}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// };

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
          "flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors",
          isActive ? "bg-purple-100 text-purple-700 shadow-sm" : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <span className={cn("h-5 w-5", isActive ? "text-purple-600" : "text-gray-500")}>{icon}</span>
        <span className="text-sm">{children}</span>
      </Link>
    </li>
  );
}
