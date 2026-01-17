import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  Users,
  IndianRupee,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Check,
  X,
  Send,
  CreditCard,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MultiSelect from "@/components/ui/MultiSelect";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock data - Replace with actual API calls
const mockKPIData = {
  totalStudents: 1250,
  totalFeeDemand: 12500000,
  totalCollected: 9800000,
  pendingAmount: 2700000,
  collectionPercentage: 78.4,
  createdFeeStructures: 45,
  pendingFeeStructures: 8,
};

const mockCollectionTrend = [
  { month: "Apr", amount: 1200000 },
  { month: "May", amount: 1500000 },
  { month: "Jun", amount: 1800000 },
  { month: "Jul", amount: 2000000 },
  { month: "Aug", amount: 1500000 },
  { month: "Sep", amount: 1800000 },
];

const mockPaymentStatus = [
  { name: "Paid", value: 65, color: "#22c55e" },
  { name: "Partial", value: 20, color: "#f59e0b" },
  { name: "Unpaid", value: 15, color: "#ef4444" },
];

const mockDefaultersData = [
  { student: "John Doe", program: "B.Sc", semester: "II", due: 50000, days: 45 },
  { student: "Jane Smith", program: "B.Com", semester: "III", due: 45000, days: 60 },
  { student: "Bob Wilson", program: "B.A", semester: "I", due: 40000, days: 30 },
  { student: "Alice Johnson", program: "BBA", semester: "II", due: 55000, days: 75 },
  { student: "Charlie Brown", program: "BCA", semester: "III", due: 60000, days: 90 },
  { student: "Diana Prince", program: "M.Sc", semester: "I", due: 70000, days: 35 },
  { student: "Edward Norton", program: "M.Com", semester: "II", due: 65000, days: 50 },
  { student: "Fiona Apple", program: "M.A", semester: "I", due: 60000, days: 25 },
  { student: "George Lucas", program: "MBA", semester: "I", due: 120000, days: 100 },
  { student: "Helen Keller", program: "B.Sc", semester: "IV", due: 50000, days: 40 },
  { student: "Isaac Newton", program: "B.Com", semester: "V", due: 45000, days: 55 },
  { student: "Julia Roberts", program: "B.A", semester: "III", due: 40000, days: 65 },
];

const mockInstallmentsData = [
  { student: "John Doe", installment: "2/4", dueDate: "2025-01-15", amount: 12500, status: "upcoming" },
  { student: "Jane Smith", installment: "1/4", dueDate: "2024-12-20", amount: 15000, status: "overdue" },
  { student: "Bob Wilson", installment: "3/4", dueDate: "2025-02-10", amount: 10000, status: "upcoming" },
  { student: "Alice Johnson", installment: "1/4", dueDate: "2024-12-15", amount: 13750, status: "overdue" },
  { student: "Charlie Brown", installment: "4/4", dueDate: "2025-03-01", amount: 15000, status: "upcoming" },
  { student: "Diana Prince", installment: "2/4", dueDate: "2025-01-20", amount: 17500, status: "upcoming" },
  { student: "Edward Norton", installment: "1/4", dueDate: "2024-12-25", amount: 16250, status: "overdue" },
  { student: "Fiona Apple", installment: "3/4", dueDate: "2025-02-05", amount: 15000, status: "upcoming" },
  { student: "George Lucas", installment: "1/4", dueDate: "2024-12-10", amount: 30000, status: "overdue" },
  { student: "Helen Keller", installment: "2/4", dueDate: "2025-01-25", amount: 12500, status: "upcoming" },
  { student: "Isaac Newton", installment: "4/4", dueDate: "2025-02-28", amount: 11250, status: "upcoming" },
  { student: "Julia Roberts", installment: "1/4", dueDate: "2024-12-30", amount: 10000, status: "overdue" },
];

const mockTransactionsData = [
  { txnId: "TXN001234", student: "John Doe", amount: 50000, mode: "UPI", status: "success" },
  { txnId: "TXN001233", student: "Jane Smith", amount: 45000, mode: "Card", status: "success" },
  { txnId: "TXN001232", student: "Bob Wilson", amount: 40000, mode: "UPI", status: "success" },
  { txnId: "TXN001231", student: "Alice Johnson", amount: 55000, mode: "Bank Transfer", status: "success" },
  { txnId: "TXN001230", student: "Charlie Brown", amount: 60000, mode: "Cash", status: "success" },
  { txnId: "TXN001229", student: "Diana Prince", amount: 70000, mode: "UPI", status: "success" },
  { txnId: "TXN001228", student: "Edward Norton", amount: 65000, mode: "Card", status: "failed" },
  { txnId: "TXN001227", student: "Fiona Apple", amount: 60000, mode: "UPI", status: "success" },
  { txnId: "TXN001226", student: "George Lucas", amount: 120000, mode: "Bank Transfer", status: "success" },
  { txnId: "TXN001225", student: "Helen Keller", amount: 50000, mode: "UPI", status: "success" },
  { txnId: "TXN001224", student: "Isaac Newton", amount: 45000, mode: "Card", status: "cancelled" },
  { txnId: "TXN001223", student: "Julia Roberts", amount: 40000, mode: "UPI", status: "success" },
];

export default function FeesHomePage() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2025-26");
  const [timeRange, setTimeRange] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter states
  const [selectedAcademicYears, setSelectedAcademicYears] = useState<string[]>([]);
  const [selectedProgramCourses, setSelectedProgramCourses] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedStudentStatus, setSelectedStudentStatus] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Modal states for alerts
  const [overdueStudentsModalOpen, setOverdueStudentsModalOpen] = useState(false);
  const [pendingRefundsModalOpen, setPendingRefundsModalOpen] = useState(false);
  const [installmentsDueModalOpen, setInstallmentsDueModalOpen] = useState(false);
  const [missingConfigModalOpen, setMissingConfigModalOpen] = useState(false);

  // Pagination states for different tables
  const [feeStructureTablePage, setFeeStructureTablePage] = useState(1);
  const [feeStructureTablePageSize, setFeeStructureTablePageSize] = useState(10);
  const [defaultersTablePage, setDefaultersTablePage] = useState(1);
  const [defaultersTablePageSize, setDefaultersTablePageSize] = useState(10);
  const [installmentsTablePage, setInstallmentsTablePage] = useState(1);
  const [installmentsTablePageSize, setInstallmentsTablePageSize] = useState(10);
  const [transactionsTablePage, setTransactionsTablePage] = useState(1);
  const [transactionsTablePageSize, setTransactionsTablePageSize] = useState(10);

  // Pagination for modal tables
  const [overdueStudentsPage, setOverdueStudentsPage] = useState(1);
  const [overdueStudentsPageSize, setOverdueStudentsPageSize] = useState(10);
  const [pendingRefundsPage, setPendingRefundsPage] = useState(1);
  const [pendingRefundsPageSize, setPendingRefundsPageSize] = useState(10);
  const [installmentsDuePage, setInstallmentsDuePage] = useState(1);
  const [installmentsDuePageSize, setInstallmentsDuePageSize] = useState(10);
  const [missingConfigPage, setMissingConfigPage] = useState(1);
  const [missingConfigPageSize, setMissingConfigPageSize] = useState(10);

  // Filters for Program Courses Summary table
  const [selectedProgramCourseSemester, setSelectedProgramCourseSemester] = useState<string>("all");
  const [selectedProgramCourseShift, setSelectedProgramCourseShift] = useState<string>("all");

  // Note: programTablePage and programTablePageSize removed as Academic Structure table has no pagination

  // Mock options for filters
  const academicYearOptions = [
    { label: "2025-26", value: "2025-26" },
    { label: "2024-25", value: "2024-25" },
    { label: "2023-24", value: "2023-24" },
  ];

  const programCourseOptions = [
    { label: "B.Sc", value: "bsc" },
    { label: "B.Com", value: "bcom" },
    { label: "B.A", value: "ba" },
    { label: "M.Sc", value: "msc" },
    { label: "M.Com", value: "mcom" },
  ];

  const semesterOptions = [
    { label: "Semester I", value: "sem1" },
    { label: "Semester II", value: "sem2" },
    { label: "Semester III", value: "sem3" },
    { label: "Semester IV", value: "sem4" },
    { label: "Semester V", value: "sem5" },
    { label: "Semester VI", value: "sem6" },
  ];

  const shiftOptions = [
    { label: "Morning", value: "morning" },
    { label: "Evening", value: "evening" },
    { label: "Night", value: "night" },
  ];

  const sectionOptions = [
    { label: "Section A", value: "a" },
    { label: "Section B", value: "b" },
    { label: "Section C", value: "c" },
    { label: "Section D", value: "d" },
  ];

  const studentStatusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const sessionOptions = [
    { label: "Session 1", value: "session1" },
    { label: "Session 2", value: "session2" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Custom Pagination Component
  const CustomPagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    onPageChange,
    onItemsPerPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
  }) => {
    const displayTotalPages = Math.max(1, totalPages);
    const displayCurrentPage = totalItems === 0 ? 1 : currentPage;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;

      if (displayTotalPages <= maxVisible) {
        for (let i = 1; i <= displayTotalPages; i++) {
          pages.push(i);
        }
      } else {
        if (displayCurrentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(displayTotalPages);
        } else if (displayCurrentPage >= displayTotalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = displayTotalPages - 3; i <= displayTotalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = displayCurrentPage - 1; i <= displayCurrentPage + 1; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(displayTotalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(endIndex, totalItems)}</span> of{" "}
            <span className="font-medium text-foreground">{totalItems}</span> entries
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, displayCurrentPage - 1))}
              disabled={displayCurrentPage === 1 || totalItems === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => {
                if (page === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                const pageNum = page as number;
                return (
                  <Button
                    key={pageNum}
                    variant={displayCurrentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`h-8 w-8 p-0 ${
                      displayCurrentPage === pageNum ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(displayTotalPages, displayCurrentPage + 1))}
              disabled={displayCurrentPage === displayTotalPages || totalItems === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    console.log("Applying filters:", {
      academicYears: selectedAcademicYears,
      programCourses: selectedProgramCourses,
      semesters: selectedSemesters,
      shifts: selectedShifts,
      sections: selectedSections,
      studentStatus: selectedStudentStatus,
      sessions: selectedSessions,
    });
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedAcademicYears([]);
    setSelectedProgramCourses([]);
    setSelectedSemesters([]);
    setSelectedShifts([]);
    setSelectedSections([]);
    setSelectedStudentStatus([]);
    setSelectedSessions([]);
  };

  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Main Tabs with Filter Button */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-background sticky top-0 z-10 px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="h-10 flex-1 justify-start overflow-x-auto min-w-0">
                <TabsTrigger value="overview" className="px-3 text-sm whitespace-nowrap">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="academic" className="px-3 text-sm whitespace-nowrap">
                  Academic Structure
                </TabsTrigger>
                <TabsTrigger value="fee-setup" className="px-3 text-sm whitespace-nowrap">
                  Fee Setup
                </TabsTrigger>
                <TabsTrigger value="collections" className="px-3 text-sm whitespace-nowrap">
                  Collections
                </TabsTrigger>
                <TabsTrigger value="payments" className="px-3 text-sm whitespace-nowrap">
                  Payments
                </TabsTrigger>
                <TabsTrigger value="defaulters" className="px-3 text-sm whitespace-nowrap">
                  Defaulters
                </TabsTrigger>
                <TabsTrigger value="admin" className="px-3 text-sm whitespace-nowrap">
                  Admin
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setIsFilterModalOpen(true)} className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0 space-y-4 md:space-y-6">
              {/* KPI Cards */}
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Card className="bg-blue-50 border-blue-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap text-blue-700">
                      Total Students
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap text-blue-700">
                      {mockKPIData.totalStudents}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-blue-600">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Current Academic Year</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap text-purple-700">
                      Total Fee Demand
                    </CardDescription>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold whitespace-nowrap text-purple-700">
                      {formatCurrency(mockKPIData.totalFeeDemand)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-purple-600">
                      <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Expected Collection</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap text-green-700">
                      Total Collected
                    </CardDescription>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-700 whitespace-nowrap">
                      {formatCurrency(mockKPIData.totalCollected)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">+12% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap text-red-700">
                      Pending Amount
                    </CardDescription>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-700 whitespace-nowrap">
                      {formatCurrency(mockKPIData.pendingAmount)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-red-600">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Outstanding</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-teal-50 border-teal-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap text-teal-700">
                      Collection %
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap text-teal-700">
                      {mockKPIData.collectionPercentage}%
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-teal-600">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Target: 85%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Structures Stats Row */}
              <div className="flex flex-wrap gap-3 md:gap-4 mt-3 md:mt-4">
                <Card className="bg-blue-50 border-blue-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap">
                      Created Fee Structures
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700 whitespace-nowrap">
                      {mockKPIData.createdFeeStructures}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-blue-600">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Fully Configured</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200 flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[200px] xl:min-w-[180px] max-w-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs sm:text-sm whitespace-nowrap">
                      Pending Fee Structures
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-700 whitespace-nowrap">
                      {mockKPIData.pendingFeeStructures}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-orange-600">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Needs Attention</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Program Courses Table */}
              <Card className="mt-4 md:mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Program Courses Summary
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Shows fee collection summary by program course including total students, eligible students,
                          and paid students.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </CardTitle>
                  <CardDescription>Fee collection summary by program course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="bg-muted font-semibold border-r border-border">Sr. No</TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border">
                            Program-Courses
                          </TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border">Total</TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border">Eligible</TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border">Paid</TableHead>
                          <TableHead className="bg-muted font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { programCourse: "B.Sc", total: 250, eligible: 245, paid: 200 },
                          { programCourse: "B.Com", total: 180, eligible: 175, paid: 150 },
                          { programCourse: "B.A", total: 150, eligible: 148, paid: 120 },
                          { programCourse: "BBA", total: 120, eligible: 118, paid: 100 },
                          { programCourse: "BCA", total: 100, eligible: 98, paid: 85 },
                          { programCourse: "M.Sc", total: 80, eligible: 78, paid: 65 },
                          { programCourse: "M.Com", total: 60, eligible: 58, paid: 50 },
                          { programCourse: "M.A", total: 50, eligible: 48, paid: 40 },
                          { programCourse: "MBA", total: 40, eligible: 38, paid: 35 },
                        ].map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="border-r border-border">{idx + 1}</TableCell>
                            <TableCell className="border-r border-border">
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                                {row.programCourse}
                              </Badge>
                            </TableCell>
                            <TableCell className="border-r border-border">{row.total}</TableCell>
                            <TableCell className="border-r border-border">{row.eligible}</TableCell>
                            <TableCell className="border-r border-border">{row.paid}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" className="h-7">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Collection Trend */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Collection Trend
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Displays monthly, quarterly, or yearly collection trends over time. Toggle between
                                different time ranges to analyze fee collection patterns.
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </CardTitle>
                        <CardDescription>Monthly collection over time</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={timeRange === "monthly" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange("monthly")}
                        >
                          Monthly
                        </Button>
                        <Button
                          variant={timeRange === "quarterly" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange("quarterly")}
                        >
                          Quarterly
                        </Button>
                        <Button
                          variant={timeRange === "yearly" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange("yearly")}
                        >
                          Yearly
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockCollectionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} name="Collection" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payment Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Payment Status
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Shows the distribution of payment statuses: Paid (65%), Partial (20%), and Unpaid (15%)
                            students.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Distribution of payment status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mockPaymentStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mockPaymentStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Alerts & Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Alert
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setOverdueStudentsModalOpen(true)}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Overdue Students</AlertTitle>
                      <AlertDescription>45 students with {">"}30 days overdue</AlertDescription>
                    </Alert>
                    <Alert
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setPendingRefundsModalOpen(true)}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Pending Refunds</AlertTitle>
                      <AlertDescription>12 refunds pending approval</AlertDescription>
                    </Alert>
                    <Alert
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setInstallmentsDueModalOpen(true)}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Installments Due</AlertTitle>
                      <AlertDescription>23 installments due today</AlertDescription>
                    </Alert>
                    <Alert
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setMissingConfigModalOpen(true)}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Missing Config</AlertTitle>
                      <AlertDescription>3 fee structures incomplete</AlertDescription>
                    </Alert>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Send Reminders</Button>
                    <Button size="sm" variant="outline">
                      Export Defaulters
                    </Button>
                    <Button size="sm" variant="outline">
                      View Pending Approvals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACADEMIC STRUCTURE TAB */}
            <TabsContent value="academic" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Semester Distribution
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Shows the number of students enrolled in each semester (I through VI). Helps understand
                            student distribution across academic levels.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Students by semester</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { semester: "I", students: 250 },
                          { semester: "II", students: 230 },
                          { semester: "III", students: 220 },
                          { semester: "IV", students: 200 },
                          { semester: "V", students: 180 },
                          { semester: "VI", students: 170 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="semester" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="students" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Shift & Section Split
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Displays student distribution across different shifts (Morning, Evening, Night) and sections
                            (A, B, C, etc.). Helps manage class allocation.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Distribution across shifts and sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shift</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Morning</TableCell>
                          <TableCell>A</TableCell>
                          <TableCell>150</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Morning</TableCell>
                          <TableCell>B</TableCell>
                          <TableCell>140</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Evening</TableCell>
                          <TableCell>A</TableCell>
                          <TableCell>120</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* FEE SETUP TAB */}
            <TabsContent value="fee-setup" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Concession Slab Impact
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Shows the number of students enrolled under each concession slab (A: 10%, B: 20%, C: 30%, D:
                            40%, E: 0%). Helps analyze fee concession distribution.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Students by concession slab</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { slab: "A (10%)", students: 250 },
                          { slab: "B (20%)", students: 180 },
                          { slab: "C (30%)", students: 120 },
                          { slab: "D (40%)", students: 80 },
                          { slab: "E (0%)", students: 720 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="slab" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="students" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Configuration Alerts
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Displays alerts for missing fee structures, late fee rules, and unmapped concession slabs.
                            Helps identify configuration issues that need attention.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Missing Fee Structure</AlertTitle>
                      <AlertDescription>B.A Semester II Evening shift has no fee structure defined</AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Late Fee Rule Missing</AlertTitle>
                      <AlertDescription>Semester III has no late fee rule configured</AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Unmapped Concession Slab</AlertTitle>
                      <AlertDescription>Concession Slab F is not mapped to any fee structure</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Structure Matrix Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Fee Structure Matrix
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Comprehensive overview of all fee structures showing affiliation, regulation, program course,
                          shift, semester, receipt type, concession slab amounts, total fees, and status. Helps track
                          fee structure completeness.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </CardTitle>
                  <CardDescription>Overview of all fee structures and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="bg-muted font-semibold whitespace-nowrap">Affiliation</TableHead>
                          <TableHead className="bg-muted font-semibold">Regulation</TableHead>
                          <TableHead className="bg-muted font-semibold">Program Course</TableHead>
                          <TableHead className="bg-muted font-semibold">Shift</TableHead>
                          <TableHead className="bg-muted font-semibold">Semester</TableHead>
                          <TableHead className="bg-muted font-semibold">Receipt Type</TableHead>
                          <TableHead className="bg-muted font-semibold">A (10%)</TableHead>
                          <TableHead className="bg-muted font-semibold">B (20%)</TableHead>
                          <TableHead className="bg-muted font-semibold">C (30%)</TableHead>
                          <TableHead className="bg-muted font-semibold">D (40%)</TableHead>
                          <TableHead className="bg-muted font-semibold">E (0%)</TableHead>
                          <TableHead className="bg-muted font-semibold">Total Fees</TableHead>
                          <TableHead className="bg-muted font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          {
                            affiliation: "BESC",
                            regulation: "2020",
                            programCourse: "B.Sc",
                            shift: "Morning",
                            semester: "I",
                            receiptType: "Admission",
                            slabA: 45000,
                            slabB: 40000,
                            slabC: 35000,
                            slabD: 30000,
                            slabE: 50000,
                            totalFee: 50000,
                            status: "defined",
                          },
                          {
                            affiliation: "BESC",
                            regulation: "2020",
                            programCourse: "B.Com",
                            shift: "Morning",
                            semester: "I",
                            receiptType: "Admission",
                            slabA: 40500,
                            slabB: 36000,
                            slabC: 31500,
                            slabD: 27000,
                            slabE: 45000,
                            totalFee: 45000,
                            status: "defined",
                          },
                          {
                            affiliation: "BESC",
                            regulation: "2020",
                            programCourse: "B.A",
                            shift: "Evening",
                            semester: "I",
                            receiptType: "Admission",
                            slabA: 36000,
                            slabB: 32000,
                            slabC: 28000,
                            slabD: 24000,
                            slabE: 40000,
                            totalFee: 40000,
                            status: "partial",
                          },
                          {
                            affiliation: "BESC",
                            regulation: "2020",
                            programCourse: "BBA",
                            shift: "Morning",
                            semester: "I",
                            receiptType: "Admission",
                            slabA: 49500,
                            slabB: 44000,
                            slabC: 38500,
                            slabD: 33000,
                            slabE: 55000,
                            totalFee: 55000,
                            status: "defined",
                          },
                          {
                            affiliation: "BESC",
                            regulation: "2020",
                            programCourse: "BCA",
                            shift: "Morning",
                            semester: "I",
                            receiptType: "Admission",
                            slabA: 54000,
                            slabB: 48000,
                            slabC: 42000,
                            slabD: 36000,
                            slabE: 60000,
                            totalFee: 60000,
                            status: "defined",
                          },
                        ].map((row, idx) => (
                          <TableRow key={idx} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>{row.affiliation}</TableCell>
                            <TableCell>{row.regulation}</TableCell>
                            <TableCell>{row.programCourse}</TableCell>
                            <TableCell>{row.shift}</TableCell>
                            <TableCell>{row.semester}</TableCell>
                            <TableCell>{row.receiptType}</TableCell>
                            <TableCell>{formatCurrency(row.slabA)}</TableCell>
                            <TableCell>{formatCurrency(row.slabB)}</TableCell>
                            <TableCell>{formatCurrency(row.slabC)}</TableCell>
                            <TableCell>{formatCurrency(row.slabD)}</TableCell>
                            <TableCell>{formatCurrency(row.slabE)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(row.totalFee)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  row.status === "defined"
                                    ? "default"
                                    : row.status === "partial"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {row.status === "defined"
                                  ? "✅ Defined"
                                  : row.status === "partial"
                                    ? "⚠️ Partial"
                                    : "❌ Missing"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4">
                      <Pagination
                        currentPage={feeStructureTablePage}
                        totalPages={Math.ceil(5 / feeStructureTablePageSize)}
                        totalItems={5}
                        itemsPerPage={feeStructureTablePageSize}
                        startIndex={(feeStructureTablePage - 1) * feeStructureTablePageSize}
                        endIndex={feeStructureTablePage * feeStructureTablePageSize}
                        onPageChange={setFeeStructureTablePage}
                        onItemsPerPageChange={setFeeStructureTablePageSize}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* COLLECTIONS TAB */}
            <TabsContent value="collections" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-700">Today</CardDescription>
                    <CardTitle className="text-2xl text-blue-700">{formatCurrency(125000)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-green-700">This Month</CardDescription>
                    <CardTitle className="text-2xl text-green-700">{formatCurrency(1800000)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-purple-700">This Quarter</CardDescription>
                    <CardTitle className="text-2xl text-purple-700">{formatCurrency(5300000)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-orange-700">This Year</CardDescription>
                    <CardTitle className="text-2xl text-orange-700">{formatCurrency(9800000)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Program Courses Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Program Courses Summary
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Displays fee collection summary by program course. Filter by semester and shift to view
                              specific data. Shows total students, eligible students, and paid students for each
                              program.
                            </p>
                          </TooltipContent>
                        </UITooltip>
                      </CardTitle>
                      <CardDescription>Fee collection summary by program course</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedProgramCourseSemester || "all"}
                        onValueChange={setSelectedProgramCourseSemester}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Semesters</SelectItem>
                          <SelectItem value="sem1">Semester I</SelectItem>
                          <SelectItem value="sem2">Semester II</SelectItem>
                          <SelectItem value="sem3">Semester III</SelectItem>
                          <SelectItem value="sem4">Semester IV</SelectItem>
                          <SelectItem value="sem5">Semester V</SelectItem>
                          <SelectItem value="sem6">Semester VI</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedProgramCourseShift || "all"} onValueChange={setSelectedProgramCourseShift}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select Shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Shifts</SelectItem>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="bg-muted font-semibold border-r border-border text-sm">
                            Sr. No
                          </TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border text-sm">
                            Program-Courses
                          </TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border text-sm">Total</TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border text-sm">
                            Eligible
                          </TableHead>
                          <TableHead className="bg-muted font-semibold border-r border-border text-sm">Paid</TableHead>
                          <TableHead className="bg-muted font-semibold text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { programCourse: "B.Sc", total: 250, eligible: 245, paid: 200 },
                          { programCourse: "B.Com", total: 180, eligible: 175, paid: 150 },
                          { programCourse: "B.A", total: 150, eligible: 148, paid: 120 },
                          { programCourse: "BBA", total: 120, eligible: 118, paid: 100 },
                          { programCourse: "BCA", total: 100, eligible: 98, paid: 85 },
                          { programCourse: "M.Sc", total: 80, eligible: 78, paid: 65 },
                          { programCourse: "M.Com", total: 60, eligible: 58, paid: 50 },
                          { programCourse: "M.A", total: 50, eligible: 48, paid: 40 },
                          { programCourse: "MBA", total: 40, eligible: 38, paid: 35 },
                        ].map((row, idx) => (
                          <TableRow key={idx} className="border-b">
                            <TableCell className="border-r border-border text-sm">{idx + 1}</TableCell>
                            <TableCell className="border-r border-border text-sm">
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                                {row.programCourse}
                              </Badge>
                            </TableCell>
                            <TableCell className="border-r border-border text-sm">{row.total}</TableCell>
                            <TableCell className="border-r border-border text-sm">{row.eligible}</TableCell>
                            <TableCell className="border-r border-border text-sm">{row.paid}</TableCell>
                            <TableCell className="text-sm">
                              <Button size="sm" variant="outline" className="h-7">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Due Ageing
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Shows outstanding fee amounts categorized by age: 0-30 days, 31-60 days, 61-90 days, and
                            over 90 days. Helps identify overdue payments.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Outstanding amounts by age</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { range: "0-30 days", amount: 1200000 },
                          { range: "31-60 days", amount: 800000 },
                          { range: "61-90 days", amount: 500000 },
                          { range: ">90 days", amount: 200000 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="amount" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Installments Tracking
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Lists all upcoming and overdue installments with student details, due dates, amounts, and
                            payment status. Helps track installment payments.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </CardTitle>
                    <CardDescription>Upcoming and overdue installments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Installment</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockInstallmentsData
                          .slice(
                            (installmentsTablePage - 1) * installmentsTablePageSize,
                            installmentsTablePage * installmentsTablePageSize,
                          )
                          .map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{row.student}</TableCell>
                              <TableCell>{row.installment}</TableCell>
                              <TableCell>{row.dueDate}</TableCell>
                              <TableCell>{formatCurrency(row.amount)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={row.status === "overdue" ? "destructive" : "outline"}
                                  className={row.status === "upcoming" ? "bg-yellow-50" : ""}
                                >
                                  {row.status === "overdue" ? "Overdue" : "Upcoming"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4">
                      <Pagination
                        currentPage={installmentsTablePage}
                        totalPages={Math.ceil(mockInstallmentsData.length / installmentsTablePageSize)}
                        totalItems={mockInstallmentsData.length}
                        itemsPerPage={installmentsTablePageSize}
                        startIndex={(installmentsTablePage - 1) * installmentsTablePageSize}
                        endIndex={installmentsTablePage * installmentsTablePageSize}
                        onPageChange={setInstallmentsTablePage}
                        onItemsPerPageChange={setInstallmentsTablePageSize}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Successful</CardDescription>
                    <CardTitle className="text-2xl text-green-600">1,245</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-2xl text-red-600">23</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Cancelled</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">12</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Refunded</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">8</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Mode Split</CardTitle>
                    <CardDescription>Distribution by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Cash", value: 35, color: "#22c55e" },
                            { name: "UPI", value: 40, color: "#3b82f6" },
                            { name: "Card", value: 15, color: "#f59e0b" },
                            { name: "Bank Transfer", value: 10, color: "#8b5cf6" },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Cash", value: 35, color: "#22c55e" },
                            { name: "UPI", value: 40, color: "#3b82f6" },
                            { name: "Card", value: 15, color: "#f59e0b" },
                            { name: "Bank Transfer", value: 10, color: "#8b5cf6" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Txn ID</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTransactionsData
                          .slice(
                            (transactionsTablePage - 1) * transactionsTablePageSize,
                            transactionsTablePage * transactionsTablePageSize,
                          )
                          .map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{row.txnId}</TableCell>
                              <TableCell>{row.student}</TableCell>
                              <TableCell>{formatCurrency(row.amount)}</TableCell>
                              <TableCell>{row.mode}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    row.status === "success"
                                      ? "bg-green-500"
                                      : row.status === "failed"
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                  }
                                >
                                  {row.status === "success"
                                    ? "Success"
                                    : row.status === "failed"
                                      ? "Failed"
                                      : "Cancelled"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4">
                      <Pagination
                        currentPage={transactionsTablePage}
                        totalPages={Math.ceil(mockTransactionsData.length / transactionsTablePageSize)}
                        totalItems={mockTransactionsData.length}
                        itemsPerPage={transactionsTablePageSize}
                        startIndex={(transactionsTablePage - 1) * transactionsTablePageSize}
                        endIndex={transactionsTablePage * transactionsTablePageSize}
                        onPageChange={setTransactionsTablePage}
                        onItemsPerPageChange={setTransactionsTablePageSize}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* DEFAULTERS TAB */}
            <TabsContent value="defaulters" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Defaulters</CardDescription>
                    <CardTitle className="text-2xl">45</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{">"} 30 days</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">25</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{">"} 60 days</CardDescription>
                    <CardTitle className="text-2xl text-orange-600">15</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{">"} 90 days</CardDescription>
                    <CardTitle className="text-2xl text-red-600">5</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Defaulter List</CardTitle>
                      <CardDescription>Students with outstanding dues</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Search students..." className="w-[250px]" />
                      <Button size="sm">Send Reminders</Button>
                      <Button size="sm" variant="outline">
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDefaultersData
                        .slice(
                          (defaultersTablePage - 1) * defaultersTablePageSize,
                          defaultersTablePage * defaultersTablePageSize,
                        )
                        .map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.student}</TableCell>
                            <TableCell>{row.program}</TableCell>
                            <TableCell>{row.semester}</TableCell>
                            <TableCell>{formatCurrency(row.due)}</TableCell>
                            <TableCell>
                              <Badge variant={row.days > 60 ? "destructive" : row.days > 30 ? "secondary" : "outline"}>
                                {row.days} days
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  Remind
                                </Button>
                                <Button size="sm" variant="outline">
                                  Apply Late Fee
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <Pagination
                      currentPage={defaultersTablePage}
                      totalPages={Math.ceil(mockDefaultersData.length / defaultersTablePageSize)}
                      totalItems={mockDefaultersData.length}
                      itemsPerPage={defaultersTablePageSize}
                      startIndex={(defaultersTablePage - 1) * defaultersTablePageSize}
                      endIndex={defaultersTablePage * defaultersTablePageSize}
                      onPageChange={setDefaultersTablePage}
                      onItemsPerPageChange={setDefaultersTablePageSize}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ADMIN TAB */}
            <TabsContent value="admin" className="mt-0 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fees Department Staff</CardTitle>
                    <CardDescription>Staff members and their roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned Programs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Dr. Rajesh Kumar</TableCell>
                          <TableCell>Head of Fees</TableCell>
                          <TableCell>All Programs</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Ms. Priya Sharma</TableCell>
                          <TableCell>Fee Collector</TableCell>
                          <TableCell>UG Programs</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mr. Amit Patel</TableCell>
                          <TableCell>Fee Collector</TableCell>
                          <TableCell>PG Programs</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Roles & Permissions</CardTitle>
                    <CardDescription>Access control matrix</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Collect</TableHead>
                          <TableHead>Refund</TableHead>
                          <TableHead>Configure</TableHead>
                          <TableHead>Reports</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Head of Fees</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Fee Collector</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">✗</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">✗</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">✓</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Recent administrative actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Dr. Rajesh Kumar</TableCell>
                        <TableCell>Approved refund for TXN001234</TableCell>
                        <TableCell>2025-01-07 10:30 AM</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Ms. Priya Sharma</TableCell>
                        <TableCell>Updated fee structure for B.Sc Semester I</TableCell>
                        <TableCell>2025-01-07 09:15 AM</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Filter Modal */}
        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filter Dashboard</DialogTitle>
              <DialogDescription>Select filters to refine the dashboard data</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic-years">Academic Years</Label>
                  <MultiSelect
                    placeholder="Select academic years"
                    options={academicYearOptions}
                    selectedOptions={selectedAcademicYears}
                    onChange={setSelectedAcademicYears}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-courses">Program Courses</Label>
                  <MultiSelect
                    placeholder="Select program courses"
                    options={programCourseOptions}
                    selectedOptions={selectedProgramCourses}
                    onChange={setSelectedProgramCourses}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesters">Semesters</Label>
                  <MultiSelect
                    placeholder="Select semesters"
                    options={semesterOptions}
                    selectedOptions={selectedSemesters}
                    onChange={setSelectedSemesters}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shifts">Shifts</Label>
                  <MultiSelect
                    placeholder="Select shifts"
                    options={shiftOptions}
                    selectedOptions={selectedShifts}
                    onChange={setSelectedShifts}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sections">Sections</Label>
                  <MultiSelect
                    placeholder="Select sections"
                    options={sectionOptions}
                    selectedOptions={selectedSections}
                    onChange={setSelectedSections}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-status">Student Status</Label>
                  <MultiSelect
                    placeholder="Select student status"
                    options={studentStatusOptions}
                    selectedOptions={selectedStudentStatus}
                    onChange={setSelectedStudentStatus}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sessions">Sessions</Label>
                  <MultiSelect
                    placeholder="Select sessions"
                    options={sessionOptions}
                    selectedOptions={selectedSessions}
                    onChange={setSelectedSessions}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Modals */}
        {/* Overdue Students Modal */}
        <Dialog open={overdueStudentsModalOpen} onOpenChange={setOverdueStudentsModalOpen}>
          <DialogContent className="w-[98vw] sm:w-[98vw] max-w-[98vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Overdue Students</DialogTitle>
              <DialogDescription>Students with payments overdue for more than 30 days</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                <Input placeholder="Search students..." className="w-full sm:max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                    Select All
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-3 w-3 mr-1" />
                    Send Reminders
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Apply Late Fee
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="bg-muted font-semibold w-12">
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Student</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Program-Course</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Semester</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Shift</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Due Amount</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Days Overdue</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDefaultersData
                      .slice(
                        (overdueStudentsPage - 1) * overdueStudentsPageSize,
                        overdueStudentsPage * overdueStudentsPageSize,
                      )
                      .map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <input type="checkbox" />
                          </TableCell>
                          <TableCell>{row.student}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              {row.program}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                              {row.semester}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                              Morning
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(row.due)}</TableCell>
                          <TableCell>
                            <Badge variant={row.days > 60 ? "destructive" : row.days > 30 ? "secondary" : "outline"}>
                              {row.days} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="h-3 w-3 mr-1" />
                                Remind
                              </Button>
                              <Button size="sm" className="text-xs h-7 bg-orange-600 hover:bg-orange-700 text-white">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Late Fee
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination
                currentPage={overdueStudentsPage}
                totalPages={Math.ceil(mockDefaultersData.length / overdueStudentsPageSize)}
                totalItems={mockDefaultersData.length}
                itemsPerPage={overdueStudentsPageSize}
                startIndex={(overdueStudentsPage - 1) * overdueStudentsPageSize}
                endIndex={overdueStudentsPage * overdueStudentsPageSize}
                onPageChange={setOverdueStudentsPage}
                onItemsPerPageChange={setOverdueStudentsPageSize}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Refunds Modal */}
        <Dialog open={pendingRefundsModalOpen} onOpenChange={setPendingRefundsModalOpen}>
          <DialogContent className="w-[98vw] sm:w-[98vw] max-w-[98vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Pending Refunds</DialogTitle>
              <DialogDescription>Refunds awaiting approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                <Input placeholder="Search refunds..." className="w-full sm:max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                    Select All
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Approve Selected
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white">
                    <X className="h-3 w-3 mr-1" />
                    Reject Selected
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="bg-muted font-semibold w-12">
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Receipt/Challan No</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Payment Date</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Payment Mode</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Student</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Program-Course</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Semester</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Shift</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[140px]">Reason for Refund</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Requested Date</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        receiptNo: "RCP001234",
                        paymentDate: "2024-12-15",
                        paymentMode: "UPI",
                        student: "John Doe",
                        programCourse: "B.Sc",
                        semester: "I",
                        shift: "Morning",
                        reason: "Course Cancellation",
                        requestedDate: "2025-01-05",
                        amount: 50000,
                      },
                      {
                        receiptNo: "RCP001233",
                        paymentDate: "2024-12-10",
                        paymentMode: "Bank Transfer",
                        student: "Jane Smith",
                        programCourse: "B.Com",
                        semester: "I",
                        shift: "Morning",
                        reason: "Admission Withdrawal",
                        requestedDate: "2025-01-04",
                        amount: 45000,
                      },
                      {
                        receiptNo: "RCP001232",
                        paymentDate: "2024-12-20",
                        paymentMode: "Cash",
                        student: "Bob Wilson",
                        programCourse: "B.A",
                        semester: "II",
                        shift: "Evening",
                        reason: "Fee Overpayment",
                        requestedDate: "2025-01-03",
                        amount: 40000,
                      },
                      {
                        receiptNo: "RCP001231",
                        paymentDate: "2024-12-18",
                        paymentMode: "UPI",
                        student: "Alice Johnson",
                        programCourse: "BBA",
                        semester: "II",
                        shift: "Morning",
                        reason: "Course Change",
                        requestedDate: "2025-01-02",
                        amount: 55000,
                      },
                      {
                        receiptNo: "RCP001230",
                        paymentDate: "2024-12-12",
                        paymentMode: "Bank Transfer",
                        student: "Charlie Brown",
                        programCourse: "BCA",
                        semester: "III",
                        shift: "Morning",
                        reason: "Admission Cancellation",
                        requestedDate: "2025-01-01",
                        amount: 60000,
                      },
                    ]
                      .slice(
                        (pendingRefundsPage - 1) * pendingRefundsPageSize,
                        pendingRefundsPage * pendingRefundsPageSize,
                      )
                      .map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <input type="checkbox" />
                          </TableCell>
                          <TableCell>{row.receiptNo}</TableCell>
                          <TableCell>{row.paymentDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {row.paymentMode}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.student}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              {row.programCourse}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                              {row.semester}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                              {row.shift}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.reason}</TableCell>
                          <TableCell>{row.requestedDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white">
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" className="text-xs h-7 bg-red-600 hover:bg-red-700 text-white">
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination
                currentPage={pendingRefundsPage}
                totalPages={Math.ceil(5 / pendingRefundsPageSize)}
                totalItems={5}
                itemsPerPage={pendingRefundsPageSize}
                startIndex={(pendingRefundsPage - 1) * pendingRefundsPageSize}
                endIndex={pendingRefundsPage * pendingRefundsPageSize}
                onPageChange={setPendingRefundsPage}
                onItemsPerPageChange={setPendingRefundsPageSize}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Installments Due Modal */}
        <Dialog open={installmentsDueModalOpen} onOpenChange={setInstallmentsDueModalOpen}>
          <DialogContent className="w-[98vw] sm:w-[98vw] max-w-[98vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Installments Due</DialogTitle>
              <DialogDescription>Installments due today or overdue</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                <Input placeholder="Search installments..." className="w-full sm:max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    <Send className="h-3 w-3 mr-1" />
                    Send Reminders
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="bg-muted font-semibold w-12">
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Student</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Program-Course</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Semester</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Shift</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Installments</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Due Date</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Amount</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Status</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInstallmentsData
                      .slice(
                        (installmentsDuePage - 1) * installmentsDuePageSize,
                        installmentsDuePage * installmentsDuePageSize,
                      )
                      .map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <input type="checkbox" />
                          </TableCell>
                          <TableCell>{row.student}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              B.Sc
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                              {row.installment.split("/")[1] || "I"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                              Morning
                            </Badge>
                          </TableCell>
                          <TableCell>{row.installment}</TableCell>
                          <TableCell>{row.dueDate}</TableCell>
                          <TableCell>{formatCurrency(row.amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={row.status === "overdue" ? "destructive" : "outline"}
                              className={row.status === "upcoming" ? "bg-yellow-50" : ""}
                            >
                              {row.status === "overdue" ? "Overdue" : "Upcoming"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="h-3 w-3 mr-1" />
                                Remind
                              </Button>
                              <Button size="sm" className="text-xs h-7 bg-teal-600 hover:bg-teal-700 text-white">
                                <Receipt className="h-3 w-3 mr-1" />
                                Receipt
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination
                currentPage={installmentsDuePage}
                totalPages={Math.ceil(mockInstallmentsData.length / installmentsDuePageSize)}
                totalItems={mockInstallmentsData.length}
                itemsPerPage={installmentsDuePageSize}
                startIndex={(installmentsDuePage - 1) * installmentsDuePageSize}
                endIndex={installmentsDuePage * installmentsDuePageSize}
                onPageChange={setInstallmentsDuePage}
                onItemsPerPageChange={setInstallmentsDuePageSize}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Missing Config Modal */}
        <Dialog open={missingConfigModalOpen} onOpenChange={setMissingConfigModalOpen}>
          <DialogContent className="w-[98vw] sm:w-[98vw] max-w-[98vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Missing Fee Structure Configurations</DialogTitle>
              <DialogDescription>Fee structures that need attention</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                <Input placeholder="Search configurations..." className="w-full sm:max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs sm:text-sm flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Create Missing Structures
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="bg-muted font-semibold w-12">
                        <input type="checkbox" />
                      </TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[60px]">Sr. No</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[100px]">Program-Course</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Semester</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[80px]">Shift</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Late Fee Applicable</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[130px]">Installment Plans</TableHead>
                      <TableHead className="bg-muted font-semibold min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        programCourse: "B.A",
                        semester: "II",
                        shift: "Evening",
                        lateFeeApplicable: "No",
                        installmentPlans: "Not Configured",
                      },
                      {
                        programCourse: "B.Sc",
                        semester: "III",
                        shift: "Morning",
                        lateFeeApplicable: "Yes",
                        installmentPlans: "Not Configured",
                      },
                      {
                        programCourse: "M.A",
                        semester: "I",
                        shift: "Evening",
                        lateFeeApplicable: "No",
                        installmentPlans: "Configured",
                      },
                      {
                        programCourse: "B.Com",
                        semester: "IV",
                        shift: "Morning",
                        lateFeeApplicable: "Yes",
                        installmentPlans: "Not Configured",
                      },
                      {
                        programCourse: "M.Sc",
                        semester: "II",
                        shift: "Evening",
                        lateFeeApplicable: "No",
                        installmentPlans: "Configured",
                      },
                    ]
                      .slice((missingConfigPage - 1) * missingConfigPageSize, missingConfigPage * missingConfigPageSize)
                      .map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <input type="checkbox" />
                          </TableCell>
                          <TableCell>{(missingConfigPage - 1) * missingConfigPageSize + idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              {row.programCourse}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                              {row.semester}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50">
                              {row.shift}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.lateFeeApplicable === "Yes" ? "default" : "outline"}
                              className={
                                row.lateFeeApplicable === "Yes" ? "bg-green-100 text-green-800 border-green-300" : ""
                              }
                            >
                              {row.lateFeeApplicable}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.installmentPlans === "Configured" ? "default" : "destructive"}
                              className={
                                row.installmentPlans === "Configured"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : ""
                              }
                            >
                              {row.installmentPlans}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white">
                              <Settings className="h-3 w-3 mr-1" />
                              Configure
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination
                currentPage={missingConfigPage}
                totalPages={Math.ceil(5 / missingConfigPageSize)}
                totalItems={5}
                itemsPerPage={missingConfigPageSize}
                startIndex={(missingConfigPage - 1) * missingConfigPageSize}
                endIndex={missingConfigPage * missingConfigPageSize}
                onPageChange={setMissingConfigPage}
                onItemsPerPageChange={setMissingConfigPageSize}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
