import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Users,
  CheckCircle,
  FileText,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Trash2,
  IndianRupee,
  SlidersHorizontal,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationFormProvider } from "../../components/ApplicationFormProvider";
import type { Admission, ApplicationFormDto } from "@/types/admissions";
import AdmissionForm from "../../components/AdmissionForm";

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
  totalApplications: 150,
  paymentsDone: 95,
  drafts: 25,
  submitted: 120,
  approved: 85,
  rejected: 15,
  paymentDue: 30,
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
    generalInfo: {
      applicationFormId: 1,
      firstName: "Rahul",
      middleName: "",
      lastName: "Sharma",
      dateOfBirth: new Date("2000-05-15"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: true,
      categoryId: 1,
      religionId: 1,
      gender: "MALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 98765 43210",
      mobileNumber: "+91 98765 43210",
      email: "rahul.sharma@email.com",
      residenceOfKolkata: false,
    },
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
    generalInfo: {
      applicationFormId: 2,
      firstName: "Priya",
      middleName: "",
      lastName: "Patel",
      dateOfBirth: new Date("2001-03-20"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: true,
      categoryId: 3,
      religionId: 1,
      gender: "FEMALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 87654 32109",
      mobileNumber: "+91 87654 32109",
      email: "priya.patel@email.com",
      residenceOfKolkata: false,
    },
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
    generalInfo: {
      applicationFormId: 3,
      firstName: "Amit",
      middleName: "",
      lastName: "Kumar",
      dateOfBirth: new Date("2000-08-10"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: false,
      categoryId: 2,
      religionId: 1,
      gender: "MALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 76543 21098",
      mobileNumber: "+91 76543 21098",
      email: "amit.kumar@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 1,
  },
  {
    id: 4,
    admissionId: 1,
    applicationNumber: "APP004",
    formStatus: "PAYMENT_DUE",
    admissionStep: "PAYMENT",
    createdAt: new Date("2024-07-04"),
    updatedAt: new Date("2024-07-07"),
    remarks: "Payment pending",
    generalInfo: {
      applicationFormId: 4,
      firstName: "Neha",
      middleName: "",
      lastName: "Singh",
      dateOfBirth: new Date("2001-12-05"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: false,
      categoryId: 1,
      religionId: 4,
      gender: "FEMALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 65432 10987",
      mobileNumber: "+91 65432 10987",
      email: "neha.singh@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 4,
  },
  {
    id: 5,
    admissionId: 1,
    applicationNumber: "APP005",
    formStatus: "REJECTED",
    admissionStep: "SUBMITTED",
    createdAt: new Date("2024-07-05"),
    updatedAt: new Date("2024-07-08"),
    remarks: "Application rejected",
    generalInfo: {
      applicationFormId: 5,
      firstName: "Vikram",
      middleName: "",
      lastName: "Mehta",
      dateOfBirth: new Date("2000-07-22"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: true,
      categoryId: 1,
      religionId: 1,
      gender: "MALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 54321 09876",
      mobileNumber: "+91 54321 09876",
      email: "vikram.mehta@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 5,
  },
  {
    id: 6,
    admissionId: 1,
    applicationNumber: "APP006",
    formStatus: "PAYMENT_SUCCESS",
    admissionStep: "SUBMITTED",
    createdAt: new Date("2024-07-06"),
    updatedAt: new Date("2024-07-09"),
    remarks: "Payment successful",
    generalInfo: {
      applicationFormId: 6,
      firstName: "Sneha",
      middleName: "",
      lastName: "Reddy",
      dateOfBirth: new Date("2001-04-18"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: false,
      categoryId: 4,
      religionId: 3,
      gender: "FEMALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 43210 98765",
      mobileNumber: "+91 43210 98765",
      email: "sneha.reddy@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 5,
  },
  {
    id: 7,
    admissionId: 1,
    applicationNumber: "APP007",
    formStatus: "SUBMITTED",
    admissionStep: "SUBMITTED",
    createdAt: new Date("2024-07-07"),
    updatedAt: new Date("2024-07-10"),
    remarks: "Application submitted",
    generalInfo: {
      applicationFormId: 7,
      firstName: "Rajesh",
      middleName: "",
      lastName: "Verma",
      dateOfBirth: new Date("2000-11-30"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: true,
      categoryId: 2,
      religionId: 2,
      gender: "MALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 32109 87654",
      mobileNumber: "+91 32109 87654",
      email: "rajesh.verma@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 5,
  },
  {
    id: 8,
    admissionId: 1,
    applicationNumber: "APP008",
    formStatus: "DRAFT",
    admissionStep: "GENERAL_INFORMATION",
    createdAt: new Date("2024-07-08"),
    updatedAt: new Date("2024-07-08"),
    remarks: "Draft application",
    generalInfo: {
      applicationFormId: 8,
      firstName: "Anjali",
      middleName: "",
      lastName: "Desai",
      dateOfBirth: new Date("2001-09-12"),
      nationalityId: 1,
      otherNationality: null,
      isGujarati: true,
      categoryId: 1,
      religionId: 1,
      gender: "FEMALE",
      degreeLevel: "UNDER_GRADUATE",
      password: "password123",
      whatsappNumber: "+91 21098 76543",
      mobileNumber: "+91 21098 76543",
      email: "anjali.desai@email.com",
      residenceOfKolkata: false,
    },
    academicInfo: null,
    courseApplication: null,
    additionalInfo: null,
    paymentInfo: null,
    currentStep: 1,
  },
];

export default function ApplicationsPage() {
  const { year } = useParams<{ year: string }>();
  const [admission] = useState<Admission | null>(dummyAdmission);
  const [stats] = useState<ApplicationFormStats>(dummyStats);
  const [applications] = useState<ApplicationFormDto[]>(dummyApplications);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems] = useState(dummyApplications.length);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: "",
    religion: "",
    annualIncome: "",
    gender: "",
    isGujarati: "",
    formStatus: "",
    course: "",
    boardUniversity: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const handleFilterChange = (field: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [field]: value === "all" ? "" : value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      category: "",
      religion: "",
      annualIncome: "",
      gender: "",
      isGujarati: "",
      formStatus: "",
      course: "",
      boardUniversity: "",
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleRowSelect = (id: number | undefined) => {
    if (typeof id !== "number") return;
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(
        applications.map((app) => (app as ApplicationFormDto).id).filter((id): id is number => typeof id === "number"),
      );
    }
    setSelectAll(!selectAll);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) {
      alert("Please select at least one application");
      return;
    }
    console.log(`Performing ${action} on`, selectedRows);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Successfully ${action.toLowerCase()}ed selected applications`);
    setSelectedRows([]);
    setSelectAll(false);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "" && value !== "all").length;
  };

  const formStatusOptions = ["DRAFT", "PAYMENT_DUE", "PAYMENT_SUCCESS", "SUBMITTED", "APPROVED", "REJECTED"];
  const genderOptions = ["MALE", "FEMALE", "TRANSGENDER"];
  const categoryOptions = ["General", "OBC", "SC", "ST"];
  const religionOptions = ["Hinduism", "Muslim", "Christian", "Sikh"];
  const annualIncomeOptions = ["Below 2 LPA", "2-5 LPA", "5-10 LPA", "Above 10 LPA"];
  const courseOptions = ["B.Tech", "M.Tech", "MBA", "BBA", "BCA"];
  const boardUniversityOptions = ["CBSE", "ICSE", "State Board", "Gujarat University", "Other"];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admission Details - {admission?.academicYear?.year ?? year}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => alert("Downloading report...")}>
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Dialog open={isAddApplicationOpen} onOpenChange={setIsAddApplicationOpen}>
              <DialogTrigger asChild>
                <Button>Add Application</Button>
              </DialogTrigger>
              <DialogContent className="w-screen h-screen max-w-none p-0">
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-auto">
                    <ApplicationFormProvider>
                      <AdmissionForm />
                    </ApplicationFormProvider>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedRows.length} application{selectedRows.length !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("APPROVE")}
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("REJECT")}
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("DELETE")}
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <StatCard
            label="Total Forms"
            value={stats.totalApplications}
            icon={<Users className="w-8 h-8 text-blue-500 opacity-60" />}
            bgColor="bg-blue-50"
            textColor="text-blue-700"
          />
          <StatCard
            label="Submitted"
            value={stats.submitted}
            icon={<CheckCircle className="w-8 h-8 text-green-500 opacity-60" />}
            bgColor="bg-green-50"
            textColor="text-green-700"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={<CheckCircle className="w-8 h-8 text-purple-500 opacity-60" />}
            bgColor="bg-purple-50"
            textColor="text-purple-700"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={<XCircle className="w-8 h-8 text-red-500 opacity-60" />}
            bgColor="bg-red-50"
            textColor="text-red-700"
          />
          <StatCard
            label="Payments Done"
            value={stats.paymentsDone}
            icon={<IndianRupee className="w-8 h-8 text-teal-500 opacity-60" />}
            bgColor="bg-teal-50"
            textColor="text-teal-700"
          />
          <StatCard
            label="Payment Due"
            value={stats.paymentDue}
            icon={<CreditCard className="w-8 h-8 text-orange-500 opacity-60" />}
            bgColor="bg-orange-50"
            textColor="text-orange-700"
          />
          <StatCard
            label="Drafts"
            value={stats.drafts}
            icon={<FileText className="w-8 h-8 text-yellow-500 opacity-60" />}
            bgColor="bg-yellow-50"
            textColor="text-yellow-700"
          />
        </div>

        <div className="mb-8 flex justify-between items-center">
          <div className="relative w-full max-w-sm flex items-center gap-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or ID..."
              className="pl-10 pr-4 w-[200px] py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="flex items-center gap-2">
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl p-6">
                  <DialogHeader>
                    <DialogTitle>Filter Applications</DialogTitle>
                    <DialogDescription>Apply filters to narrow down the application forms.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
                    <FilterSelect
                      label="Category"
                      options={categoryOptions}
                      value={tempFilters.category}
                      onChange={(value) => handleFilterChange("category", value)}
                    />
                    <FilterSelect
                      label="Religion"
                      options={religionOptions}
                      value={tempFilters.religion}
                      onChange={(value) => handleFilterChange("religion", value)}
                    />
                    <FilterSelect
                      label="Annual Income"
                      options={annualIncomeOptions}
                      value={tempFilters.annualIncome}
                      onChange={(value) => handleFilterChange("annualIncome", value)}
                    />
                    <FilterSelect
                      label="Gender"
                      options={genderOptions}
                      value={tempFilters.gender}
                      onChange={(value) => handleFilterChange("gender", value)}
                    />
                    <FilterSelect
                      label="Is Gujarati"
                      options={["all", "true", "false"]}
                      value={tempFilters.isGujarati || "all"}
                      onChange={(value) => handleFilterChange("isGujarati", value)}
                    />
                    <FilterSelect
                      label="Form Status"
                      options={formStatusOptions}
                      value={tempFilters.formStatus}
                      onChange={(value) => handleFilterChange("formStatus", value)}
                    />
                    <FilterSelect
                      label="Course"
                      options={courseOptions}
                      value={tempFilters.course}
                      onChange={(value) => handleFilterChange("course", value)}
                    />
                    <FilterSelect
                      label="Board/University"
                      options={boardUniversityOptions}
                      value={tempFilters.boardUniversity}
                      onChange={(value) => handleFilterChange("boardUniversity", value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                    {getActiveFilterCount() > 0 && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                    <DialogClose asChild>
                      <Button variant="secondary">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => alert("Downloading forms...")}>
              <FileText className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHeader className="bg-gray-100 border-b border-gray-200">
                <TableRow>
                  <TableHead className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitted?
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Religion
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Income
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Gender
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Gujarati?
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Course
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Board/University
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {applications.length > 0 ? (
                  applications.map((app) => {
                    const appId = typeof app.id === "number" ? app.id : undefined;
                    const name = app.generalInfo
                      ? `${app.generalInfo.firstName} ${app.generalInfo.middleName ?? ""} ${app.generalInfo.lastName}`.trim()
                      : "-";
                    const gender = app.generalInfo?.gender ?? "-";
                    const category = app.generalInfo?.categoryId ?? "-";
                    const religion = app.generalInfo?.religionId ?? "-";
                    const isGujarati = app.generalInfo?.isGujarati ? "Yes" : "No";
                    const submittedAt = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-";
                    return (
                      <TableRow
                        key={appId}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${typeof appId === "number" && selectedRows.includes(appId) ? "bg-blue-50" : ""}`}
                      >
                        <TableCell className="w-12 px-6 py-4">
                          <input
                            type="checkbox"
                            checked={typeof appId === "number" && selectedRows.includes(appId)}
                            onChange={() => handleRowSelect(appId)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {typeof appId === "number" ? appId : ""}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{name}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${app.formStatus === "SUBMITTED" || app.formStatus === "APPROVED" || app.formStatus === "PAYMENT_SUCCESS" ? "bg-green-100 text-green-800" : app.formStatus === "REJECTED" || app.formStatus === "PAYMENT_FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {app.formStatus}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {submittedAt}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{category}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{religion}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">-</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{gender}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {isGujarati}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">-</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">-</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-gray-500">
                      No application forms found for this admission year.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalItems > 0 && totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px ml-4"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        ) : typeof page === "number" ? (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                          >
                            {page}
                          </button>
                        ) : null,
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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

const FilterSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const displayValue = value || "all";
  return (
    <div className="w-full">
      <Label className="block text-sm font-medium text-gray-700 mb-2">{label}</Label>
      <Select value={displayValue} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {label === "Is Gujarati" ? (option === "true" ? "Yes" : option === "false" ? "No" : "All") : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
