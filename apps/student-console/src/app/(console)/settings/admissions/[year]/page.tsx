"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdmissionForm from "@/components/admissions/AdmissionForm";
import { ApplicationFormProvider } from "@/providers/adm-application-form-provider";
import { AdmissionDto } from "@/types/admissions";

interface ApplicationFormStats {
  totalApplications: number;
  paymentsDone: number;
  drafts: number;
  submitted: number;
  approved: number;
  rejected: number;
  paymentDue: number;
}

interface Application {
  id: number;
}

export default function AdmissionDetailsPage() {
  const params = useParams();
  const year = params.year as string;
  const [admission, setAdmission] = useState<AdmissionDto | null>(null);
  const [stats, setStats] = useState<ApplicationFormStats | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        size: itemsPerPage.toString(),
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (filters.category && filters.category !== "all" && filters.category !== "All") queryParams.append("category", filters.category);
      if (filters.religion && filters.religion !== "all" && filters.religion !== "All") queryParams.append("religion", filters.religion);
      if (filters.annualIncome && filters.annualIncome !== "all" && filters.annualIncome !== "All") queryParams.append("annualIncome", filters.annualIncome);
      if (filters.gender && filters.gender !== "all" && filters.gender !== "All") queryParams.append("gender", filters.gender);
      if (filters.isGujarati === "true" || filters.isGujarati === "false") {
        queryParams.append("isGujarati", filters.isGujarati);
      }
      if (filters.formStatus && filters.formStatus !== "all" && filters.formStatus !== "All") queryParams.append("formStatus", filters.formStatus);
      if (filters.course && filters.course !== "all" && filters.course !== "All") queryParams.append("course", filters.course);
      if (filters.boardUniversity && filters.boardUniversity !== "all" && filters.boardUniversity !== "All") queryParams.append("boardUniversity", filters.boardUniversity);
console.log('Frontend filters:', filters, tempFilters);
console.log(`/api/admissions/${year}?${queryParams.toString()}`);
      const response = await fetch(`/api/admissions/${year}?${queryParams.toString()}`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch admission details");
      }
      setAdmission(result.admission);
      setStats(result.stats);
      console.log(result)
      setApplications(result.applications);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      console.error("Error fetching admission details:", error);
      toast.error(error.message || "Failed to load admission details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, currentPage, itemsPerPage, searchTerm]);

  const handleFilterChange = (field: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [field]: value === "all" ? "" : value }));
    setFilters((prev) => ({ ...prev, [field]: value === "all" ? "" : value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    fetchData();
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
    setTimeout(() => fetchData(), 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleRowSelect = (id: number) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(applications.map(app => app.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one application");
      return;
    }

    try {
      const response = await fetch(`/api/admissions/${year}/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          applicationIds: selectedRows,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      toast.success(`Successfully ${action.toLowerCase()}ed selected applications`);
      setSelectedRows([]);
      setSelectAll(false);
      fetchData(); // Refresh the data
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform bulk action');
    }
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== "" && value !== "all").length;
  };

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

  const formStatusOptions = ["DRAFT", "PAYMENT_DUE", "PAYMENT_SUCCESS", "SUBMITTED", "APPROVED", "REJECTED"];
  const genderOptions = ["MALE", "FEMALE", "TRANSGENDER"];
  const isGujaratiOptions = [
    { label: "All", value: "all" },
    { label: "Yes", value: "true" },
    { label: "No", value: "false" }
  ];
  const categoryOptions = ["General", "OBC", "SC", "ST"];
  const religionOptions = ["Hinduism", "Muslim", "Christian", "Sikh"];
  const annualIncomeOptions = ["Below 2 LPA", "2-5 LPA", "5-10 LPA", "Above 10 LPA", "₹ 5 Lakh - ₹ 7.5 Lakh"];
  const courseOptions = ["B.Tech", "M.Tech", "MBA", "MCA", "BBA", "BCA"];
  const boardUniversityOptions = ["CBSE", "ICSE", "State Board", "Gujarat University", "Other"];

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admission Details - {admission.academicYear.year}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/api/admissions/${year}/download-report`, '_blank')}>
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Dialog open={isAddApplicationOpen} onOpenChange={setIsAddApplicationOpen}>
              <DialogTrigger asChild>
                <Button disabled={new Date().getFullYear() != Number(year)}>
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="w-screen h-screen max-w-none p-0">
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                        <p className="ml-4 text-lg text-gray-600">Loading admission form...</p>
                      </div>
                    ) : !admission ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg shadow-md flex flex-col items-center">
                          <AlertCircle className="h-10 w-10 mb-4" />
                          <p className="text-lg font-semibold">Admission Data Not Loaded</p>
                          <p className="mt-2 text-center text-sm">Unable to load admission details for year {year}.</p>
                        </div>
                      </div>
                    ) : (
                      <ApplicationFormProvider admission={admission}>
                        <AdmissionForm />
                      </ApplicationFormProvider>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedRows.length} application{selectedRows.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('APPROVE')}
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('REJECT')}
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('DELETE')}
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {stats && (
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
        )}

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
                    <DialogDescription>
                      Apply filters to narrow down the application forms.
                    </DialogDescription>
                  </DialogHeader>
                  {/* {console.log('Dialog tempFilters:', tempFilters)} */}
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
                    <Button type="submit" onClick={applyFilters}>Apply Filters</Button>
                    {getActiveFilterCount() > 0 && (
                      <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
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
            <Button variant="outline" onClick={() => window.open(`/api/admissions/${year}/download-forms`, '_blank')}>
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
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted?</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Religion</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Income</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gujarati?</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Board/University</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        selectedRows.includes(app.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <TableCell className="w-12 px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(app.id)}
                          onChange={() => handleRowSelect(app.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.id}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.name}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.formStatus === "SUBMITTED" || app.formStatus === "APPROVED" || app.formStatus === "PAYMENT_SUCCESS"
                              ? "bg-green-100 text-green-800"
                              : app.formStatus === "REJECTED" || app.formStatus === "PAYMENT_FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {app.formStatus}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.category || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.religion || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.annualIncome || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.gender || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.isGujarati ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.course || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {app.boardUniversity || "-"}
                      </TableCell>
                    </TableRow>
                  ))
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

          {/* Pagination */}
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
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          totalItems
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{totalItems}</span>{" "}
                      results
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

                      {getPageNumbers().map((page, index) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(+page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

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
      <Label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </Label>
      <Select value={displayValue} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {label === "Is Gujarati"
                ? option === "true"
                  ? "Yes"
                  : option === "false"
                  ? "No"
                  : "All"
                : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
