import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Banknote, PlusCircle, Pencil } from "lucide-react";
// import { toast } from "sonner";
// import FeeStructureForm from "@/components/fees/fee-structure-form/FeeStructureForm";
import FeeStructureMaster from "@/components/fees/FeeStructureMaster";
// import { getAllCourses } from "../../services/course-api";
import { FeeStructureDto, CreateFeeStructureDto } from "@repo/db/dtos/fees";
import { AcademicYear } from "@/types/academics/academic-year";
import { updateFeeStructureByDto } from "@/services/fees-api";
import { useFeesStructures, useAcademicYearsFromFeesStructures, useFeesHeads } from "@/hooks/useFees";
import { useFeesReceiptTypes } from "@/hooks/useFees";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeesReceiptType } from "@/types/fees";
import { Class } from "@/types/academics/class";
import { getAllClasses } from "@/services/classes.service";
import { Pagination } from "@/components/ui/pagination";

const FeesStructurePage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const [selectedFeeStructureForEdit, setSelectedFeeStructureForEdit] = useState<FeeStructureDto | null>(null);
  const [selectedConcessionSlabModal, setSelectedConcessionSlabModal] = useState<FeeStructureDto | null>(null);
  const [feesStructures, setFeesStructures] = useState<FeeStructureDto[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedReceiptType, setSelectedReceiptType] = useState<FeesReceiptType | null>(null);

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
  const [pageSize, setPageSize] = useState(10);
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();
  const { loading: feesHeadsLoading } = useFeesHeads();

  // Use the new hooks
  const { academicYears, loading: academicYearsLoading } = useAcademicYearsFromFeesStructures();

  // State for selected class (used for filtering)
  const [selectedClassFilter, setSelectedClassFilter] = useState<Class | null>(null);

  // When academic year changes, reset selected class filter
  useEffect(() => {
    setSelectedClassFilter(null);
  }, [selectedAcademicYear]);

  useEffect(() => {
    getAllClasses().then((data) => setClasses(data));
  }, []);

  const handleReceiptTypeChange = useCallback(
    (value: string) => {
      const id = Number(value);
      const tmpSelectedFeesReceiptType = feesReceiptTypes.find((ele) => ele.id === id);
      setSelectedReceiptType(tmpSelectedFeesReceiptType ?? null);
    },
    [feesReceiptTypes],
  );

  const handleClassChange = useCallback(
    (value: string) => {
      const id = Number(value);
      const tmpSelectedClass = classes.find((ele) => ele.id === id);
      setSelectedClassFilter(tmpSelectedClass ?? null);
    },
    [classes],
  );

  const handleEdit = (fs: FeeStructureDto) => {
    setSelectedFeeStructureForEdit(fs);
    setShowFeeStructureForm(true);
  };

  const handleCreate = () => {
    setSelectedFeeStructureForEdit(null);
    setShowFeeStructureForm(true);
  };

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => {
    const filterObj: {
      academicYearId?: number;
      classId?: number;
      receiptTypeId?: number;
      programCourseId?: number;
      shiftId?: number;
    } = {};

    if (selectedAcademicYear?.id) {
      filterObj.academicYearId = selectedAcademicYear.id;
    }
    if (selectedReceiptType?.id) {
      filterObj.receiptTypeId = selectedReceiptType.id;
    }
    if (selectedClassFilter?.id) {
      filterObj.classId = selectedClassFilter.id;
    }

    return filterObj;
  }, [selectedAcademicYear?.id, selectedReceiptType?.id, selectedClassFilter?.id]);

  // Fetch fees structures with pagination
  useEffect(() => {
    fetchFeesStructuresPaginated(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters, fetchFeesStructuresPaginated]);

  // Update fees structures when paginated data changes
  useEffect(() => {
    setFeesStructures(paginatedFeesStructures);
  }, [paginatedFeesStructures]);

  // Auto-select receipt type only once when data first loads
  useEffect(() => {
    if (paginatedFeesStructures.length > 0 && !selectedReceiptType && feesReceiptTypes.length > 0) {
      const firstReceiptTypeId = paginatedFeesStructures[0]?.receiptType?.id;
      if (firstReceiptTypeId) {
        const tmpSelectedFeesReceiptType = feesReceiptTypes.find((ele) => ele.id === firstReceiptTypeId);
        if (tmpSelectedFeesReceiptType) {
          setSelectedReceiptType(tmpSelectedFeesReceiptType);
        }
      }
    }
  }, [paginatedFeesStructures, feesReceiptTypes, selectedReceiptType]);

  // Memoize filtered structures based on receipt type, class, and academic year
  const memoizedFilteredFeesStructures = useMemo(() => {
    let filtered = paginatedFeesStructures;

    if (selectedReceiptType?.id) {
      filtered = filtered.filter((ele) => ele.receiptType?.id === selectedReceiptType.id);
    }

    if (selectedClassFilter?.id) {
      filtered = filtered.filter((ele) => ele.class?.id === selectedClassFilter.id);
    }

    if (selectedAcademicYear?.id) {
      filtered = filtered.filter((ele) => ele.academicYear?.id === selectedAcademicYear.id);
    }

    return filtered;
  }, [paginatedFeesStructures, selectedReceiptType?.id, selectedClassFilter?.id, selectedAcademicYear?.id]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAcademicYear, selectedReceiptType, selectedClassFilter]);

  // Auto-select current/active academic year if not set (prioritize isCurrentYear === true)
  useEffect(() => {
    if (!selectedAcademicYear && academicYears.length > 0) {
      // First, try to find the academic year marked as current
      const currentYear = academicYears.find((year) => year.isCurrentYear === true);
      if (currentYear) {
        setSelectedAcademicYear(currentYear);
      } else {
        // Fallback to first academic year if no current year is found
        setSelectedAcademicYear(academicYears[0] || null);
      }
    }
  }, [academicYears, selectedAcademicYear]);

  // Memoize sorted filtered structures to prevent unnecessary re-sorting
  const sortedFilteredFeesStructures = useMemo(() => {
    return [...memoizedFilteredFeesStructures].sort((a, b) => {
      const aName = a.programCourse?.name || "";
      const bName = b.programCourse?.name || "";
      return aName.localeCompare(bName);
    });
  }, [memoizedFilteredFeesStructures]);

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
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
              <Select
                value={selectedAcademicYear?.id ? String(selectedAcademicYear.id) : "all"}
                onValueChange={(val) => {
                  const year = academicYears.find((y) => String(y.id) === val);
                  setSelectedAcademicYear(year || null);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 flex items-center justify-between">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <div className="flex items-center gap-4 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Type</label>
              <Select
                value={selectedReceiptType ? String(selectedReceiptType.id) : ""}
                onValueChange={handleReceiptTypeChange}
                // Always enabled
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Receipt Type" />
                </SelectTrigger>
                <SelectContent>
                  {feesReceiptTypes
                    .filter((rt) => feesStructures.some((fs) => fs.receiptType?.id === rt.id))
                    .map((rt) => (
                      <SelectItem key={rt.id} value={String(rt.id)}>
                        {rt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Class/Semester</label>
              <Select
                value={selectedClassFilter ? String(selectedClassFilter.id) : ""}
                onValueChange={handleClassChange}
                disabled={!selectedReceiptType}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((cls) =>
                      feesStructures.some(
                        (fs) => fs.receiptType?.id === selectedReceiptType?.id && fs.class?.id === cls.id,
                      ),
                    )
                    .map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </nav>
        <Button onClick={handleCreate} size="sm">
          <PlusCircle className="h-4 w-4" />
          Create Structure
        </Button>
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
              {sortedFilteredFeesStructures.map((fs) => {
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

      {/* Pagination Controls */}
      {pagination && pagination.totalElements > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalElements}
            itemsPerPage={pageSize}
            startIndex={(currentPage - 1) * pageSize}
            endIndex={Math.min(currentPage * pageSize, pagination.totalElements)}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(newPageSize) => {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }}
          />
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
            const filters: {
              academicYearId?: number;
              receiptTypeId?: number;
              classId?: number;
            } = {};
            if (selectedAcademicYear?.id) {
              filters.academicYearId = selectedAcademicYear.id;
            }
            if (selectedReceiptType?.id) {
              filters.receiptTypeId = selectedReceiptType.id;
            }
            if (selectedClassFilter?.id) {
              filters.classId = selectedClassFilter.id;
            }
            await fetchFeesStructuresPaginated(currentPage, pageSize, filters);
          } catch (error) {
            console.error("Error saving fee structure:", error);
            alert("Failed to save fee structure. Please try again.");
          }
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
