import React, { useState, useEffect, useMemo } from "react";
import { Banknote, PlusCircle, Pencil, Filter, X } from "lucide-react";
import FeeStructureMaster from "@/components/fees/FeeStructureMaster";
import { FeeStructureDto, CreateFeeStructureDto } from "@repo/db/dtos/fees";
// import { AcademicYear } from "@/types/academics/academic-year";
import { updateFeeStructureByDto } from "@/services/fees-api";
import { useFeesStructures, useAcademicYearsFromFeesStructures, useFeesHeads } from "@/hooks/useFees";
import { useFeesReceiptTypes } from "@/hooks/useFees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// import { FeesReceiptType } from "@/types/fees";
import { Class } from "@/types/academics/class";
import { getAllClasses } from "@/services/classes.service";
import { getAllShifts } from "@/services/academic";
import { Shift } from "@/types/academics/shift";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface FeeStructureFilters {
  academicYearId: number | null;
  receiptTypeId: number | null;
  classId: number | null;
  shiftId: number | null;
}

const FeesStructurePage: React.FC = () => {
  const { currentAcademicYear } = useAcademicYear();
  const [showAddModal, setShowAddModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const [selectedFeeStructureForEdit, setSelectedFeeStructureForEdit] = useState<FeeStructureDto | null>(null);
  const [selectedConcessionSlabModal, setSelectedConcessionSlabModal] = useState<FeeStructureDto | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FeeStructureFilters>({
    academicYearId: null,
    receiptTypeId: null,
    classId: null,
    shiftId: null,
  });

  // Local filter state for dialog (only applied when "Apply Filters" is clicked)
  const [localFilters, setLocalFilters] = useState<FeeStructureFilters>(filters);

  // Use the fees API hook with pagination
  const {
    feesStructures: paginatedFeesStructures,
    loading: feesLoading,
    pagination,
    refetch: fetchFeesStructuresPaginated,
    addFeesStructure,
  } = useFeesStructures();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();
  const { loading: feesHeadsLoading } = useFeesHeads();

  // Use the new hooks
  const { academicYears, loading: academicYearsLoading } = useAcademicYearsFromFeesStructures();

  // Set default academic year from Redux
  useEffect(() => {
    if (currentAcademicYear?.id && !filters.academicYearId) {
      setFilters((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear.id!,
      }));
      setLocalFilters((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear.id!,
      }));
    }
  }, [currentAcademicYear]);

  // Sync local filters with actual filters when dialog opens
  useEffect(() => {
    if (isFilterDialogOpen) {
      setLocalFilters(filters);
    }
  }, [isFilterDialogOpen, filters]);

  useEffect(() => {
    getAllClasses().then((data) => setClasses(data));
    getAllShifts().then((data) => setShifts(data));
  }, []);

  // Memoize filters object for API call
  const apiFilters = useMemo(() => {
    const filterObj: {
      academicYearId?: number;
      classId?: number;
      receiptTypeId?: number;
      programCourseId?: number;
      shiftId?: number;
    } = {};

    if (filters.academicYearId) {
      filterObj.academicYearId = filters.academicYearId;
    }
    if (filters.receiptTypeId) {
      filterObj.receiptTypeId = filters.receiptTypeId;
    }
    if (filters.classId) {
      filterObj.classId = filters.classId;
    }
    if (filters.shiftId) {
      filterObj.shiftId = filters.shiftId;
    }

    return filterObj;
  }, [filters]);

  // Fetch fees structures with pagination
  useEffect(() => {
    fetchFeesStructuresPaginated(currentPage, pageSize, apiFilters);
  }, [currentPage, pageSize, apiFilters, fetchFeesStructuresPaginated]);

  // Refetch when filters change (after initialization)
  useEffect(() => {
    if (currentPage === 1) return; // Already handled by the effect above
    setCurrentPage(1);
  }, [filters]);

  const handleEdit = (fs: FeeStructureDto) => {
    setSelectedFeeStructureForEdit(fs);
    setShowFeeStructureForm(true);
  };

  const handleCreate = () => {
    setSelectedFeeStructureForEdit(null);
    setShowFeeStructureForm(true);
  };

  // Memoize sorted structures (backend already filters, so just sort)
  const sortedFeesStructures = useMemo(() => {
    return [...paginatedFeesStructures].sort((a, b) => {
      const aName = a.programCourse?.name || "";
      const bName = b.programCourse?.name || "";
      return aName.localeCompare(bName);
    });
  }, [paginatedFeesStructures]);

  // Calculate total items and pages
  const totalItems = pagination?.totalElements || 0;
  const totalPages = pagination?.totalPages || 1;

  if (academicYearsLoading || feesLoading || receiptTypesLoading || feesHeadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading fees structures...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 text-white rounded-lg">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Fees Structure</h1>
              <p className="text-sm text-gray-600">Manage and organize fee structures</p>
            </div>
          </div>
          <Button onClick={handleCreate} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Structure
          </Button>
        </div>
      </div>

      {/* Filter Button and Active Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 justify-start mb-4">
        {/* Filter Dialog Trigger */}
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).filter((v) => v !== null && v !== undefined).length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {Object.values(filters).filter((v) => v !== null && v !== undefined).length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filter Fee Structures</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Grid layout for filters - 2 rows x 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Academic Year Filter */}
                <div className="grid gap-2">
                  <Label htmlFor="academic-year">Academic Year</Label>
                  <Select
                    value={localFilters.academicYearId?.toString() || "all"}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, academicYearId: value === "all" ? null : Number(value) })
                    }
                  >
                    <SelectTrigger id="academic-year">
                      <SelectValue placeholder="All Academic Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Academic Years</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id!.toString()}>
                          {year.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Receipt Type Filter */}
                <div className="grid gap-2">
                  <Label htmlFor="receipt-type">Receipt Type</Label>
                  <Select
                    value={localFilters.receiptTypeId?.toString() || "all"}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, receiptTypeId: value === "all" ? null : Number(value) })
                    }
                  >
                    <SelectTrigger id="receipt-type">
                      <SelectValue placeholder="All Receipt Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Receipt Types</SelectItem>
                      {feesReceiptTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id!.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class/Semester Filter */}
                <div className="grid gap-2">
                  <Label htmlFor="class">Class/Semester</Label>
                  <Select
                    value={localFilters.classId?.toString() || "all"}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, classId: value === "all" ? null : Number(value) })
                    }
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id!.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Filter */}
                <div className="grid gap-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Select
                    value={localFilters.shiftId?.toString() || "all"}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, shiftId: value === "all" ? null : Number(value) })
                    }
                  >
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="All Shifts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shifts</SelectItem>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id!.toString()}>
                          {shift.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const defaultAcademicYearId = currentAcademicYear?.id || null;
                  setLocalFilters({
                    academicYearId: defaultAcademicYearId,
                    receiptTypeId: null,
                    classId: null,
                    shiftId: null,
                  });
                }}
              >
                Clear All
              </Button>
              <Button
                onClick={() => {
                  setFilters(localFilters);
                  setCurrentPage(1);
                  setIsFilterDialogOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 ml-2">
          {filters.academicYearId && (
            <Badge
              variant="outline"
              className="text-xs border-slate-300 text-slate-700 bg-slate-50 flex items-center gap-1"
            >
              {academicYears.find((y) => y.id === filters.academicYearId)?.year || "Academic Year"}
              <button
                aria-label="Clear academic year filter"
                className="ml-1 hover:text-slate-900"
                onClick={() => {
                  setFilters({ ...filters, academicYearId: null });
                  setCurrentPage(1);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.receiptTypeId && (
            <Badge
              variant="outline"
              className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 flex items-center gap-1"
            >
              {feesReceiptTypes.find((t) => t.id === filters.receiptTypeId)?.name || "Receipt Type"}
              <button
                aria-label="Clear receipt type filter"
                className="ml-1 hover:text-indigo-900"
                onClick={() => {
                  setFilters({ ...filters, receiptTypeId: null });
                  setCurrentPage(1);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.classId && (
            <Badge
              variant="outline"
              className="text-xs border-orange-300 text-orange-700 bg-orange-50 flex items-center gap-1"
            >
              {classes.find((c) => c.id === filters.classId)?.name || "Class"}
              <button
                aria-label="Clear class filter"
                className="ml-1 hover:text-orange-900"
                onClick={() => {
                  setFilters({ ...filters, classId: null });
                  setCurrentPage(1);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.shiftId && (
            <Badge
              variant="outline"
              className="text-xs border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-1"
            >
              {shifts.find((s) => s.id === filters.shiftId)?.name || "Shift"}
              <button
                aria-label="Clear shift filter"
                className="ml-1 hover:text-purple-900"
                onClick={() => {
                  setFilters({ ...filters, shiftId: null });
                  setCurrentPage(1);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-[200px] border-r">Program Course</TableHead>
                <TableHead className="bg-yellow-50 border-r">Base Amount</TableHead>
                <TableHead className="border-r">Shift</TableHead>
                <TableHead className="border-r">Components</TableHead>
                <TableHead className="border-r">Concession Slab</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeesStructures.map((fs) => {
                const programCourseName = fs.programCourse?.name || "-";
                const baseAmount = fs.baseAmount || 0;
                const shiftName = fs.shift?.name || "-";
                const feeHeads = fs.components
                  .map((c) => c.feeHead)
                  .filter((head): head is NonNullable<typeof head> => head !== null && head !== undefined);
                const hasConcessionSlabs = fs.feeStructureConcessionSlabs && fs.feeStructureConcessionSlabs.length > 0;

                return (
                  <TableRow key={fs.id || Math.random()} className="border-b">
                    <TableCell className="border-r">
                      {programCourseName !== "-" ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {programCourseName}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold bg-yellow-50 text-yellow-800 border-r">
                      ₹ {baseAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="border-r">
                      {shiftName !== "-" ? (
                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                          {shiftName}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="border-r">
                      {feeHeads.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {feeHeads.map((feeHead) => (
                            <Badge
                              key={feeHead.id}
                              variant="outline"
                              className="border-blue-300 text-blue-700 bg-blue-50"
                            >
                              {feeHead.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="border-r">
                      {hasConcessionSlabs ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConcessionSlabModal(fs)}
                          className="text-xs"
                        >
                          Summary ({fs.feeStructureConcessionSlabs?.length || 0})
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(fs)}
                        title="Edit"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4 text-purple-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls - Matching exams page style */}
      {!feesLoading && totalItems > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-0">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <span className="hidden sm:inline">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of{" "}
              {totalItems} results
            </span>
            <span className="sm:hidden">
              Page {currentPage} of {totalPages} ({totalItems} total)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0 flex-shrink-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-shrink-0"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Fee</DialogTitle>
            <DialogDescription>Create a new fee structure entry</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Tuition Fee"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="Mandatory">Mandatory</option>
                <option value="Optional">Optional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applied To</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., All Students"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Fee description..."
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button className="flex-1">Add Fee</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Fee Structure Master Modal */}
      <FeeStructureMaster
        open={showFeeStructureForm}
        onClose={() => {
          setShowFeeStructureForm(false);
          setSelectedFeeStructureForEdit(null);
        }}
        receiptTypes={feesReceiptTypes}
        classes={classes}
        feeStructure={selectedFeeStructureForEdit}
        onSave={async (data: CreateFeeStructureDto) => {
          try {
            if (selectedFeeStructureForEdit?.id) {
              // Update existing fee structure
              await updateFeeStructureByDto(selectedFeeStructureForEdit.id, data);
            } else {
              // Create new fee structure
              await addFeesStructure(data);
            }
            setShowFeeStructureForm(false);
            setSelectedFeeStructureForEdit(null);
            // Refresh the fees structures list
            await fetchFeesStructuresPaginated(currentPage, pageSize, apiFilters);
          } catch (error) {
            console.error("Error saving fee structure:", error);
            alert("Failed to save fee structure. Please try again.");
          }
        }}
        onRefresh={async () => {
          // Refresh the fees structures list
          await fetchFeesStructuresPaginated(currentPage, pageSize, apiFilters);
        }}
      />

      {/* Summary Modal - Reusing Preview Modal UI */}
      <Dialog
        open={!!selectedConcessionSlabModal}
        onOpenChange={(open) => !open && setSelectedConcessionSlabModal(null)}
      >
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Fee Structure – Summary</DialogTitle>
          </DialogHeader>
          {selectedConcessionSlabModal && (
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 min-h-0">
              {/* Fee Structure Details */}
              <div className="border-2 border-gray-400 rounded">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Academic Year
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Class
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Receipt Type
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="w-[250px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                        Program Course
                      </TableHead>
                      <TableHead className="w-[200px] p-2 text-center text-base font-semibold whitespace-nowrap">
                        Shift
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b-2 border-gray-400">
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedConcessionSlabModal.academicYear ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-blue-100 text-blue-800 border-blue-300">
                              {selectedConcessionSlabModal.academicYear.year}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedConcessionSlabModal.class ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-green-100 text-green-800 border-green-300">
                              {selectedConcessionSlabModal.class.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedConcessionSlabModal.receiptType ? (
                          <div className="flex justify-center">
                            <Badge className="text-sm bg-purple-100 text-purple-800 border-purple-300">
                              {selectedConcessionSlabModal.receiptType.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        <div className="flex justify-center">
                          <span className="text-gray-900 font-semibold">
                            ₹{selectedConcessionSlabModal.baseAmount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                        {selectedConcessionSlabModal.programCourse ? (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            <Badge className="text-xs py-0.5 px-2 bg-indigo-100 text-indigo-800 border-indigo-300">
                              {selectedConcessionSlabModal.programCourse.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center p-2 min-h-[100px]">
                        {selectedConcessionSlabModal.shift ? (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            <Badge className="text-xs py-0.5 px-2 bg-orange-100 text-orange-800 border-orange-300">
                              {selectedConcessionSlabModal.shift.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Concession Slab x Component Table */}
              {selectedConcessionSlabModal.components &&
                selectedConcessionSlabModal.components.length > 0 &&
                selectedConcessionSlabModal.feeStructureConcessionSlabs &&
                selectedConcessionSlabModal.feeStructureConcessionSlabs.length > 0 && (
                  <div className="border-2 border-gray-400 rounded overflow-hidden">
                    {/* Fee Components Header */}
                    <div className="bg-gray-100 border-b-2 border-gray-400 p-3">
                      <h3 className="text-lg font-semibold text-gray-900">Fee Components</h3>
                    </div>
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="border-b-2 border-gray-400">
                          <TableHead className="w-[80px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-blue-50">
                            Sr. No
                          </TableHead>
                          <TableHead className="w-[200px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-green-50">
                            Fee Head
                          </TableHead>
                          <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-yellow-50">
                            Allocation
                          </TableHead>
                          {selectedConcessionSlabModal.feeStructureConcessionSlabs.map((slabMapping, slabIndex) => {
                            const slab = slabMapping.feeConcessionSlab;
                            const concessionRate = slabMapping.concessionRate || 0;
                            return (
                              <TableHead
                                key={slabMapping.id || slabIndex}
                                className={`w-[150px] p-2 text-center text-base font-semibold whitespace-nowrap ${
                                  slabIndex < selectedConcessionSlabModal.feeStructureConcessionSlabs.length - 1
                                    ? "border-r-2 border-gray-400"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor:
                                    slabIndex % 4 === 0
                                      ? "#fef3c7" // yellow-100
                                      : slabIndex % 4 === 1
                                        ? "#fce7f3" // pink-100
                                        : slabIndex % 4 === 2
                                          ? "#dbeafe" // blue-100
                                          : "#e0e7ff", // indigo-100
                                }}
                              >
                                {slab?.name || "-"} ({concessionRate}%)
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedConcessionSlabModal.components.map((component, index) => {
                          const componentAmount = Math.round(
                            ((selectedConcessionSlabModal.baseAmount || 0) * (component.feeHeadPercentage || 0)) / 100,
                          );
                          return (
                            <TableRow
                              key={component.id || index}
                              className="border-b-2 border-gray-400"
                              style={{
                                backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                              }}
                            >
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-blue-50">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-green-50">
                                {component.feeHead?.name || "-"}{" "}
                                <span className="text-red-600">({component.feeHeadPercentage || 0}%)</span>
                              </TableCell>
                              <TableCell className="text-center border-r-2 border-gray-400 p-2 font-semibold bg-yellow-50">
                                ₹{componentAmount.toLocaleString()}
                              </TableCell>
                              {selectedConcessionSlabModal.feeStructureConcessionSlabs.map((slabMapping, slabIndex) => {
                                const concessionRate = slabMapping.concessionRate || 0;
                                // Calculate concession amount for this component with this slab
                                const concessionAmount = Math.round((componentAmount * concessionRate) / 100);
                                const totalAfterConcession = componentAmount - concessionAmount;
                                const isLastColumn =
                                  slabIndex === selectedConcessionSlabModal.feeStructureConcessionSlabs.length - 1;
                                return (
                                  <TableCell
                                    key={slabMapping.id || slabIndex}
                                    className={`text-center p-2 font-semibold ${
                                      !isLastColumn ? "border-r-2 border-gray-400" : ""
                                    }`}
                                    style={{
                                      backgroundColor:
                                        slabIndex % 4 === 0
                                          ? "#fef3c7" // yellow-100
                                          : slabIndex % 4 === 1
                                            ? "#fce7f3" // pink-100
                                            : slabIndex % 4 === 2
                                              ? "#dbeafe" // blue-100
                                              : "#e0e7ff", // indigo-100
                                    }}
                                  >
                                    ₹{totalAfterConcession.toLocaleString()}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                        {/* Total Row */}
                        <TableRow className="border-t-4 border-gray-600 bg-gray-100">
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-blue-50">
                            Total
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-green-50">
                            -
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-yellow-50">
                            ₹{selectedConcessionSlabModal.baseAmount.toLocaleString()}
                          </TableCell>
                          {selectedConcessionSlabModal.feeStructureConcessionSlabs.map((slabMapping, slabIndex) => {
                            const concessionRate = slabMapping.concessionRate || 0;
                            // Calculate total for this slab column (sum of all components after concession)
                            const columnTotal = selectedConcessionSlabModal.components.reduce((sum, component) => {
                              const componentAmount = Math.round(
                                ((selectedConcessionSlabModal.baseAmount || 0) * (component.feeHeadPercentage || 0)) /
                                  100,
                              );
                              const concessionAmount = Math.round((componentAmount * concessionRate) / 100);
                              const totalAfterConcession = componentAmount - concessionAmount;
                              return sum + totalAfterConcession;
                            }, 0);
                            const isLastColumn =
                              slabIndex === selectedConcessionSlabModal.feeStructureConcessionSlabs.length - 1;
                            return (
                              <TableCell
                                key={slabMapping.id || slabIndex}
                                className={`text-center p-2 font-bold text-base ${
                                  !isLastColumn ? "border-r-2 border-gray-400" : ""
                                }`}
                                style={{
                                  backgroundColor:
                                    slabIndex % 4 === 0
                                      ? "#fef3c7" // yellow-100
                                      : slabIndex % 4 === 1
                                        ? "#fce7f3" // pink-100
                                        : slabIndex % 4 === 2
                                          ? "#dbeafe" // blue-100
                                          : "#e0e7ff", // indigo-100
                                }}
                              >
                                ₹{columnTotal.toLocaleString()}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* Notes Section */}
              <div className="bg-gray-50 border-t-2 border-l-2 border-r-2 border-b-2 border-gray-300 px-6 py-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Notes:</h4>
                <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-800">
                  <li className="leading-relaxed">
                    <span className="font-medium">No late fee charges will be applicable</span> as this fee structure is
                    not configured with time-bound payment deadlines.
                  </li>
                  <li className="leading-relaxed">
                    <span className="font-medium">Full payment is required upfront</span> as no installment plan has
                    been configured for this fee structure.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesStructurePage;
