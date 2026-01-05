import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Banknote, PlusCircle, Pencil } from "lucide-react";
// import { toast } from "sonner";
// import FeeStructureForm from "@/components/fees/fee-structure-form/FeeStructureForm";
import FeeStructureMaster from "@/components/fees/FeeStructureMaster";
// import { getAllCourses } from "../../services/course-api";
import { FeeStructureDto } from "@repo/db/dtos/fees";
import { AcademicYear } from "@/types/academics/academic-year";
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
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedConcessionSlabModal, setSelectedConcessionSlabModal] = useState<FeeStructureDto | null>(null);
  const [feesStructures, setFeesStructures] = useState<FeeStructureDto[]>([]);

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

  const handleEdit = (_fs: FeeStructureDto) => {
    setShowFeeStructureForm(true);
  };

  const handleCreate = () => {
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

  // Auto-select first academic year if not set (only run once)
  useEffect(() => {
    if (!selectedAcademicYear && academicYears.length > 0) {
      setSelectedAcademicYear(academicYears[0] || null);
    }
  }, [academicYears.length, selectedAcademicYear]);

  // Get all unique fee heads from components for modal columns
  const uniqueFeeHeads = useMemo(() => {
    const feeHeadMap = new Map<number, FeeStructureDto["components"][0]["feeHead"]>();
    memoizedFilteredFeesStructures.forEach((fs) => {
      fs.components?.forEach((component) => {
        if (component.feeHead?.id) {
          feeHeadMap.set(component.feeHead.id, component.feeHead);
        }
      });
    });
    return Array.from(feeHeadMap.values());
  }, [memoizedFilteredFeesStructures]);

  // Memoize sorted filtered structures to prevent unnecessary re-sorting
  const sortedFilteredFeesStructures = useMemo(() => {
    return [...memoizedFilteredFeesStructures].sort((a, b) => {
      const aName = a.programCourse?.name || "";
      const bName = b.programCourse?.name || "";
      return aName.localeCompare(bName);
    });
  }, [memoizedFilteredFeesStructures]);

  // Color variants for components (cycling through different colors, excluding orange which is used for shift)
  const componentColors = [
    "border-blue-300 text-blue-700 bg-blue-50", // Light blue
    "border-red-300 text-red-700 bg-red-50", // Red
    "border-indigo-300 text-indigo-700 bg-indigo-50", // Indigo
    "border-cyan-300 text-cyan-700 bg-cyan-50", // Cyan
    "border-pink-300 text-pink-700 bg-pink-50", // Pink
    "border-amber-300 text-amber-700 bg-amber-50", // Amber
  ];

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
                          {feeHeads.map((feeHead, index) => (
                            <Badge
                              key={feeHead.id}
                              variant="outline"
                              className={componentColors[index % componentColors.length]}
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
                          View Slabs ({fs.feeStructureConcessionSlabs?.length || 0})
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
              {sortedFilteredFeesStructures.length > 0 && (
                <TableRow className="bg-gray-50 font-bold border-t-2">
                  <TableCell className="border-r">Total</TableCell>
                  <TableCell className="bg-yellow-200 text-yellow-900 text-lg border-r">
                    ₹ {sortedFilteredFeesStructures.reduce((sum, fs) => sum + (fs.baseAmount || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="border-r"></TableCell>
                  <TableCell className="border-r"></TableCell>
                  <TableCell className="border-r"></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
        </div>
      </div>

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
      {showFeeStructureForm && (
        <FeeStructureMaster
          open={showFeeStructureForm}
          onClose={() => setShowFeeStructureForm(false)}
          receiptTypes={feesReceiptTypes}
          classes={classes}
          onSave={async (data) => {
            try {
              await addFeesStructure(data as any);
              setShowFeeStructureForm(false);
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
      )}

      {/* Concession Slab Modal */}
      <Dialog
        open={!!selectedConcessionSlabModal}
        onOpenChange={(open) => !open && setSelectedConcessionSlabModal(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Concession Slabs - {selectedConcessionSlabModal?.programCourse?.name || "N/A"}</DialogTitle>
            <DialogDescription>View concession slab details and adjusted amounts for each fee head</DialogDescription>
          </DialogHeader>

          {selectedConcessionSlabModal?.feeStructureConcessionSlabs &&
          selectedConcessionSlabModal.feeStructureConcessionSlabs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r">Concession Slab</TableHead>
                    {uniqueFeeHeads
                      .filter(
                        (feeHead): feeHead is NonNullable<typeof feeHead> =>
                          feeHead?.id !== null && feeHead?.id !== undefined,
                      )
                      .map((feeHead, index) => {
                        // Use different colors for fee heads (not green, not orange - orange is for shift)
                        const feeHeadColors = [
                          "border-blue-300 text-blue-700 bg-blue-50",
                          "border-red-300 text-red-700 bg-red-50",
                          "border-indigo-300 text-indigo-700 bg-indigo-50",
                          "border-cyan-300 text-cyan-700 bg-cyan-50",
                          "border-pink-300 text-pink-700 bg-pink-50",
                          "border-amber-300 text-amber-700 bg-amber-50",
                        ];
                        return (
                          <TableHead key={feeHead.id} className="border-r">
                            <Badge variant="outline" className={feeHeadColors[index % feeHeadColors.length]}>
                              {feeHead.name || "-"}
                            </Badge>
                          </TableHead>
                        );
                      })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedConcessionSlabModal.feeStructureConcessionSlabs.map((slabMapping) => {
                    const slabName = slabMapping.feeConcessionSlab?.name || "-";
                    const concessionRate = slabMapping.concessionRate || 0;
                    const baseAmount = selectedConcessionSlabModal.baseAmount || 0;

                    return (
                      <TableRow key={slabMapping.id || Math.random()} className="border-b">
                        <TableCell className="font-medium border-r">
                          {slabName !== "-" ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {slabName}
                            </Badge>
                          ) : (
                            "-"
                          )}
                          {concessionRate > 0 && (
                            <Badge variant="outline" className="ml-2 border-green-300 text-green-700 bg-green-50">
                              {concessionRate}%
                            </Badge>
                          )}
                        </TableCell>
                        {uniqueFeeHeads
                          .filter(
                            (feeHead): feeHead is NonNullable<typeof feeHead> =>
                              feeHead?.id !== null && feeHead?.id !== undefined,
                          )
                          .map((feeHead, index) => {
                            // Find if this component is concession applicable
                            const component = selectedConcessionSlabModal.components.find(
                              (c) => c.feeHead?.id === feeHead.id,
                            );

                            if (!component || !component.isConcessionApplicable) {
                              return (
                                <TableCell key={feeHead.id} className="text-gray-400 border-r">
                                  -
                                </TableCell>
                              );
                            }

                            // Calculate concession amount for this component
                            const componentAmount = (baseAmount * (component.feeHeadPercentage || 0)) / 100;
                            const concessionAmount = componentAmount * (concessionRate / 100);
                            const adjustedAmount = componentAmount - concessionAmount;

                            return (
                              <TableCell
                                key={feeHead.id}
                                className={
                                  index <
                                  uniqueFeeHeads.filter(
                                    (fh): fh is NonNullable<typeof fh> => fh?.id !== null && fh?.id !== undefined,
                                  ).length -
                                    1
                                    ? "border-r"
                                    : ""
                                }
                              >
                                <div className="font-medium">₹ {adjustedAmount.toLocaleString()}</div>
                                {concessionAmount > 0 && (
                                  <div className="text-xs text-green-700">-₹ {concessionAmount.toLocaleString()}</div>
                                )}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No concession slabs found</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesStructurePage;
