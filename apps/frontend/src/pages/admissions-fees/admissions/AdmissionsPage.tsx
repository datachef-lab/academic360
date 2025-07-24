import { useState, useMemo, useEffect } from "react";
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import CreateAdmissionDialog from "./components/CreateAdmissionDialog";
import AdmissionsStats from "./components/AdmissionsStats";
import AdmissionConfigureDialog from "./components/AdmissionConfigureDialog";
import {  AdmissionSummary, Stats } from "./types";
import { fetchStatsSummary, fetchAdmissionSummaries, createAdmission } from "@/services/admissions.service";
import { getAllCourses } from "@/services/course-api";
import { Course } from "@/types/course-design/course";
import { Admission } from "@/types/admissions";

export default function AdmissionsPage() {
  useEffect(() => {
    document.title = "Admissions Dashboard";
  }, []);

  const [data, setData] = useState<AdmissionSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleAdmCloseLoading, setToggleAdmLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AdmissionSummary;
    direction: "asc" | "desc";
  }>({ key: "admissionYear", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // const [newAdmissionYear, setNewAdmissionYear] = useState<number>(new Date().getFullYear());
  
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionSummary | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [admissions, stats] = await Promise.all([
        fetchAdmissionSummaries(),
        fetchStatsSummary(),
      ]);
      setData(admissions);
      setStats(stats);
      setTotalItems(admissions.length);
    } catch (error) {
      console.error("Error fetching admissions data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) => item.admissionYear.toString().includes(searchTerm));
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === "number" && typeof bValue === "number") {
          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleSort = (key: keyof AdmissionSummary): void => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  const getSortIcon = (columnName: keyof AdmissionSummary): JSX.Element => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === "asc" ? (
        <ChevronUp className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 ml-1" />
      );
    }
    return <ChevronDown className="w-4 h-4 ml-1 opacity-30" />;
  };

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
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

  const handleView = (year: number) => {
    navigate(`/dashboard/admissions-fees/admissions/${year}`);
  };

  const confirmCloseAdmission = async () => {
    setToggleAdmLoading(true);
    // TODO: Call backend API to close/open admission
    // Example: await fetch(`/api/admissions/${selectedYear}`, { method: 'PUT', body: JSON.stringify({ isClosed: ... }) })
    setTimeout(() => {
      setToggleAdmLoading(false);
      setIsDialogOpen(false);
      fetchData();
    }, 1000);
  };

  const handleCreateAdmission = async (newAdmission: Admission) => {
    try {
      // if (!academicYearId) throw new Error('No academic year selected');
      await createAdmission(newAdmission);
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      alert("Failed to create admission");
      console.error("Error creating admission:", error);
    }
  };

  const handleConfigureAdmission = async (admission: AdmissionSummary) => {
    setSelectedAdmission(admission);
    try {
      const allCoursesRes = await getAllCourses();
      setAllCourses(allCoursesRes.payload);
      setIsConfigDialogOpen(true);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Failed to fetch courses");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admissions Data</h1>
        </div>

        {stats && <AdmissionsStats stats={stats} />}

        <div className="flex justify-between items-center">
          <div className="mb-6 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white shadow-sm">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by year..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <CreateAdmissionDialog
            open={isCreateDialogOpen}
            setOpen={setIsCreateDialogOpen}
            onCreate={handleCreateAdmission}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    onClick={() => handleSort("admissionYear")}
                  >
                    <div className="flex items-center">Admission Year{getSortIcon("admissionYear")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    onClick={() => handleSort("totalApplications")}
                  >
                    <div className="flex items-center">Total Applications{getSortIcon("totalApplications")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    onClick={() => handleSort("totalPayments")}
                  >
                    <div className="flex items-center">Payments Done{getSortIcon("totalPayments")}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    onClick={() => handleSort("totalDrafts")}
                  >
                    <div className="flex items-center">Drafts{getSortIcon("totalDrafts")}</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.admissionYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.totalApplications}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center">
                        {item.totalPayments}
                        <span className="ml-2 text-xs text-gray-500">
                          (
                          {item.totalApplications > 0
                            ? Math.round((item.totalPayments / item.totalApplications) * 100)
                            : "0"}
                          %)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center">
                        {item.totalDrafts}
                        <span className="ml-2 text-xs text-gray-500">
                          (
                          {item.totalApplications > 0
                            ? Math.round((item.totalDrafts / item.totalApplications) * 100)
                            : "0"}
                          %)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleView(item.admissionYear)}>
                        View Details
                      </Button>
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleConfigureAdmission(item)}>
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        className={item.isClosed ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}
                        onClick={() => {
                          setSelectedYear(item.admissionYear);
                          setIsDialogOpen(true);
                        }}
                      >
                        {item.isClosed ? "Open" : "Close"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
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
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(+page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                          >
                            {page}
                          </button>
                        ),
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to {data.find((a) => a.admissionYear === selectedYear)?.isClosed ? "open" : "close"}{" "}
              the admission for year {selectedYear}?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCloseAdmission} disabled={toggleAdmCloseLoading}>
              {toggleAdmCloseLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAdmission && (
        <AdmissionConfigureDialog
        
          open={isConfigDialogOpen}
          setOpen={setIsConfigDialogOpen}
          admissionId={selectedAdmission.id}
          allCourses={allCourses}
          refetchData={fetchData}
        />
      )}
    </div>
  );
}
