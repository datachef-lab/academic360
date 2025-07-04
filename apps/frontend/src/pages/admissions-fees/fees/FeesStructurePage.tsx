  import React, { useState, useEffect } from "react";
import {
  Banknote,
  PlusCircle,
  // Upload,
  X,
  // AlertCircle,
  // Layers3,
  // CheckCircle,
  // XCircle,
  // Search,
  Pencil,
} from "lucide-react";
// import { toast } from "sonner";
import FeeStructureForm from "@/components/fees/fee-structure-form/FeeStructureForm";
// import { getAllCourses } from "../../services/course-api";
import { Course } from "@/types/academics/course";
import { FeesStructureDto, FeesSlabMapping, FeesSlab, CreateFeesStructureDto } from "@/types/fees";
import {AcademicYear} from "@/types/academics/academic-year"
import { useFeesStructures, useAcademicYearsFromFeesStructures, useCoursesFromFeesStructures } from "@/hooks/useFees";
import { useFeesSlabMappings, useFeesReceiptTypes } from "@/hooks/useFees";
import { checkSlabsExistForAcademicYear, getFeesStructuresByAcademicYearAndCourse } from "@/services/fees-api";
import axiosInstance from "@/utils/api";
import { useShifts } from "@/hooks/useShifts";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Shift } from "@/types/academics/shift";
import { FeesReceiptType } from "@/types/fees";
import { Class } from "@/types/academics/class";
import { getAllClasses } from "@/services/classes.service";

const FeesStructurePage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const setClasses = useState<Class[]>([])[1];
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [modalFieldsDisabled, setModalFieldsDisabled] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab] = useState<"fees" | "slabs">("fees");
  const [currentFeesStructure, setCurrentFeesStructure] = useState<FeesStructureDto | null>(null);
  const [initialStep, setInitialStep] = useState(1);
  const [slabYearMappings] = useState<FeesSlabMapping[]>([]);
  const setSlabsExistForYear = useState(false)[1];
  const [allSlabs, setAllSlabs] = useState<FeesSlab[]>([]);
  const [filteredFeesStructures, setFilteredFeesStructures] = useState<FeesStructureDto[]>([]);
  const [feesStructures, setFeesStructures] = useState<FeesStructureDto[]>([]);
  const [slabEditMode, setSlabEditMode] = useState(false);
  const setEditingSlabMapping = useState<FeesSlabMapping | null>(null)[1];
  const { shifts, loading: shiftsLoading } = useShifts();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  const [selectedReceiptType, setSelectedReceiptType] = useState<FeesReceiptType | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Use the fees API hook
  const { loading: feesLoading, addFeesStructure, updateFeesStructureById } = useFeesStructures();
  const { addFeesSlabMappings } = useFeesSlabMappings();
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();

  // Use the new hooks
  const { academicYears, loading: academicYearsLoading } = useAcademicYearsFromFeesStructures();
  const { courses: coursesForSelectedYear } = useCoursesFromFeesStructures(selectedAcademicYear?.id ?? null);

  // Add state for selected class
  const setSelectedClass = useState<Class | null>(null)[1];

  // When academic year or course changes, reset selected class
  useEffect(() => {
    setSelectedClass(null);
  }, [selectedAcademicYear, selectedCourse]);

  // Optionally, filter classes by course/academic year if needed
  // For now, use all classes

  useEffect(() => {
    getAllClasses()
      .then(data => setClasses(data));
  }, [])

  useEffect(() => {
    const checkSlabsExist = async () => {
      if (selectedAcademicYear?.id) {
        try {
          const result = await checkSlabsExistForAcademicYear(selectedAcademicYear.id);
          setSlabsExistForYear(result.exists);
          console.log("Slabs exist for year:", result.exists);
        } catch {
          // Error handled
          setSlabsExistForYear(false);
        }
      } else {
        setSlabsExistForYear(false);
      }
    };

    checkSlabsExist();
  }, [selectedAcademicYear]);

  const fetchSlabs = async () => {
    try {
      const res = await axiosInstance.get<FeesSlab[]>("/api/v1/fees/slabs");
      setAllSlabs(res.data);
    } catch (error) {
      console.log(error);
      setAllSlabs([]);
    }
  };

  useEffect(() => {
    if (selectedAcademicYear?.id) {
      console.log("in fetching slabs, selectedAcademicYear", selectedAcademicYear);
      fetchSlabs();
    } else {
      setAllSlabs([]);
    }
  }, [selectedAcademicYear]);

  // const slabsForYear = slabYearMappings.map(mapping => {
  //   const slab = allSlabs.find(s => s.id === mapping.feesSlabId);
  //   return {
  //     ...slab,
  //     feeConcessionRate: mapping.feeConcessionRate,
  //     mappingId: mapping.id,
  //     status: slab && typeof (slab as any).disabled !== 'undefined' ? ((slab as any).disabled ? 'Disabled' : 'Enabled') : 'Enabled',
  //   };
  // });

  // // Helper to get concession rate for a slab
  // const getConcessionRate = (slabId: number): number => {
  //   const mapping = slabYearMappings.find(
  //     m => m.feesSlabId === slabId && m.academicYearId === selectedAcademicYear?.id
  //   );
  //   return mapping ? mapping.feeConcessionRate : 0;
  // };

  const handleReceiptTypeChange = (value: string) => {
    const id = Number(value);
    const tmpSelectedFeesReceiptType = feesReceiptTypes.find((ele) => ele.id === id);

    // Filter by the newly selected receipt type
    const tmpFilteredFeesStructures = feesStructures.filter((ele) => ele.feesReceiptTypeId === id);

    setSelectedReceiptType(tmpSelectedFeesReceiptType ?? null);
    setFilteredFeesStructures(tmpFilteredFeesStructures);
    setSelectedShift(null); // Reset shift when receipt type changes
  };

  const handleShiftChange = (value: string) => {
    const id = Number(value);
    const tmpSelectedShift = shifts.find((ele) => ele.id === id);

    // Filter by both the selected receipt type and the newly selected shift
    const tmpFilteredFeesStructures = feesStructures.filter(
      (ele) => ele.feesReceiptTypeId === (selectedReceiptType?.id ?? 0) && ele.shift?.id === id,
    );

    setSelectedShift(tmpSelectedShift ?? null);
    setFilteredFeesStructures(tmpFilteredFeesStructures);
  };

  const fetchAvailableCourses = async (
    academicYearId: number | undefined,
    allCourses: Course[],
    setAvailableCourses: React.Dispatch<React.SetStateAction<Course[]>>,
  ) => {
    if (typeof academicYearId !== "number") {
      setAvailableCourses([]);
      return;
    }
    const filtered: Course[] = [];
    for (const course of allCourses) {
      if (typeof course.id !== "number") continue;
      if (typeof academicYearId !== "number") continue;
      const structures = await getFeesStructuresByAcademicYearAndCourse(academicYearId, course.id);
      if (!structures || structures.length === 0) {
        filtered.push(course);
      } else {
        filtered.push(course);
      }
    }
    setAvailableCourses(filtered);
  };

  const handleFeeStructureSubmit = async (givenFeesStructure: FeesStructureDto | CreateFeesStructureDto, formType: "ADD" | "EDIT") => {
    console.log("Fee Structure Form Data:", givenFeesStructure);
    try {
      // Duplicate check (for create only)
      if (!currentFeesStructure?.id) {
        const duplicate = filteredFeesStructures.find(
          (fs) => {
            // Type guard for course/courses
            const givenCourseId = 'course' in givenFeesStructure
              ? givenFeesStructure.course?.id
              : givenFeesStructure.courses[0]?.id;
            return (
              fs.academicYear?.id === givenFeesStructure.academicYear?.id &&
              fs.course?.id === givenCourseId &&
              fs.class.id === givenFeesStructure.class.id &&
              fs.shift?.id === givenFeesStructure.shift?.id &&
              fs.feesReceiptTypeId === givenFeesStructure.feesReceiptTypeId
            );
          }
        );
        if (duplicate) {
          alert(
            "A fee structure with the same Academic Year, Course, Semester, Shift, and Receipt Type already exists.",
          );
          return;
        }
      }
      if (givenFeesStructure.feesSlabMappings.length > 0) {
        await addFeesSlabMappings(givenFeesStructure.feesSlabMappings);
      }
      if (formType === "EDIT") {
        await updateFeesStructureById(currentFeesStructure!.id!, givenFeesStructure);
      } else {
        const created = await addFeesStructure(givenFeesStructure as CreateFeesStructureDto);
        if (created) {
          setSelectedAcademicYear(created.academicYear ?? null);
          setSelectedCourse(created.course ?? null);

          const tmpSelectedFeesReceiptType = feesReceiptTypes.find((ele) => ele.id == created.feesReceiptTypeId!)!;
          setSelectedReceiptType(tmpSelectedFeesReceiptType);
          setSelectedShift(created.shift!);

          const tmpFilteredFeesStructures = feesStructures.filter(
            (ele) => ele.feesReceiptTypeId === tmpSelectedFeesReceiptType?.id && ele.shift?.id === created.shift?.id,
          );

          setFilteredFeesStructures(tmpFilteredFeesStructures);
        }
      }
      setShowFeeStructureForm(false);
    } catch {
      // Error handled
    } finally {
      await fetchFeesStructures();
    }
  };

  // const handleAdd = () => {
  //   if (!selectedAcademicYear || !selectedCourse) {
  //     toast.error("Please select both Academic Year and Course before adding a fee structure.");
  //     return;
  //   }

  //   if (!slabsExistForYear) {
  //     toast.error("Please create fee slabs for this academic year first", {
  //       description: "Navigate to the Slabs tab to create fee slabs.",
  //       duration: 5000,
  //     });
  //     setActiveTab("slabs"); // Switch to slabs tab
  //     return;
  //   }

  //   setModalFieldsDisabled(true);
  //   const newSlabMapping: FeesSlabMapping = {
  //     id: allSlabs[0].id!,
  //     feesSlabId: allSlabs[0].id!,
  //     feesStructureId: 0, // Placeholder, update as needed
  //     feeConcessionRate: 0,
  //   };
  //   setCurrentFeesStructure({
  //     id: undefined,
  //     academicYear: selectedAcademicYear,
  //     course: selectedCourse,
  //     closingDate: new Date(),
  //     semester: 1,
  //     advanceForSemester: null,
  //     shift: null,
  //     feesReceiptTypeId: null,
  //     startDate: new Date(),
  //     endDate: new Date(),
  //     onlineStartDate: new Date(),
  //     onlineEndDate: new Date(),
  //     numberOfInstalments: null,
  //     instalmentStartDate: null,
  //     instalmentEndDate: null,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     advanceForCourse: null,
  //     components: [],
  //     feesSlabMappings: [],
  //   });
  //   setShowFeeStructureForm(true);
  //   setInitialStep(3); // Skip to fee configuration since slabs exist
  // };

  const handleEdit = (fs: FeesStructureDto) => {
    setModalFieldsDisabled(true);
    setCurrentFeesStructure(fs);
    setShowFeeStructureForm(true);
    setInitialStep(2);
  };

  const handleCreate = () => {
    setModalFieldsDisabled(false);
    setCurrentFeesStructure(null);
    setShowFeeStructureForm(true);
    setInitialStep(1);
  };

  // const handleDelete = async (id: number) => {
  //   if (window.confirm("Are you sure you want to delete this fees structure?")) {
  //     await deleteFeesStructureById(id);
  //   }
  // };

  const fetchFeesStructures = async () => {
    try {
      console.log("fetching fees structures: -");
      const res = await axiosInstance.get<FeesStructureDto[]>(
        `/api/v1/fees/structure/by-academic-year-and-course/${selectedAcademicYear!.id}/${selectedCourse!.id}`,
      );
      setFeesStructures(res.data || []);
      console.log("fetching fees structures, res.data: -", res.data);

      if (res.data.length > 0) {
        const tmpSelectedFeesReceiptType = feesReceiptTypes.find((ele) => ele.id == res.data[0].feesReceiptTypeId);
        console.log("tmpSelectedFeesReceiptType:", tmpSelectedFeesReceiptType);
        const tmpArr = res.data.filter((ele) => ele.feesReceiptTypeId == tmpSelectedFeesReceiptType?.id);
        console.log("tmpArr:", tmpArr);
        const tmpSelectedShift = tmpArr[0].shift;
        console.log("tmpSelectedShift:", tmpSelectedShift);
        const tmpFilteredFeesStructures = tmpArr.filter(
          (ele) => ele.feesReceiptTypeId === tmpSelectedFeesReceiptType?.id && ele.shift?.id === tmpSelectedShift?.id,
        );
        console.log("tmpFilteredFeesStructures:", tmpFilteredFeesStructures);
        setSelectedReceiptType(tmpSelectedFeesReceiptType!);
        setSelectedShift(tmpSelectedShift!);
        setFilteredFeesStructures(tmpFilteredFeesStructures);
      }
    } catch (error) {
      console.log(error);
      setFilteredFeesStructures([]);
    }
  };

  useEffect(() => {
    if (selectedAcademicYear?.id && selectedCourse?.id) {
      fetchFeesStructures();
    } else {
      setFilteredFeesStructures([]);
    }
  }, [selectedAcademicYear, selectedCourse]);

  const handleSlabModalClose = () => {
    setShowSlabModal(false);
    setEditingSlabMapping(null);
    setSlabEditMode(false);
  };

  const availableSlabsToCreate = allSlabs.filter(
    (slab) => !slabYearMappings.some((mapping) => mapping.feesSlabId === slab.id),
  );
  const isCreateSlabDisabled = availableSlabsToCreate.length === 0;

  // const toRoman = (num: number | null | undefined) => {
  //   if (!num) return "";
  //   const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  //   return romans[num - 1] || num;
  // };

  useEffect(() => {
    fetchAvailableCourses(selectedAcademicYear?.id, coursesForSelectedYear || [], setAvailableCourses);
  }, [selectedAcademicYear, coursesForSelectedYear]);

  if (academicYearsLoading || feesLoading || receiptTypesLoading || shiftsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading fees structures...</div>
      </div>
    );
  }

  return (
    <div className="">
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
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
              <Select
                value={selectedCourse?.id ? String(selectedCourse.id) : "all"}
                onValueChange={(val) => {
                  const course = coursesForSelectedYear.find((c) => String(c.id) === val);
                  setSelectedCourse(course || null);
                }}
              >
                <SelectTrigger className="w-40" disabled={!selectedAcademicYear}>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.name}
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
                    .filter((rt) => feesStructures.some((fs) => fs.feesReceiptTypeId === rt.id))
                    .map((rt) => (
                      <SelectItem key={rt.id} value={String(rt.id)}>
                        {rt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
              <Select
                value={selectedShift ? String(selectedShift.id) : ""}
                onValueChange={handleShiftChange}
                disabled={!selectedReceiptType} // Only disable if no receipt type is selected
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts
                    .filter((shft) =>
                      feesStructures.some(
                        (fs) => fs.feesReceiptTypeId === selectedReceiptType?.id && fs.shift?.id === shft.id,
                      ),
                    )
                    .map((shft) => (
                      <SelectItem key={shft.id} value={String(shft.id)}>
                        {shft.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </nav>
        <button
          onClick={() => {
            if (activeTab === "slabs") {
              setShowSlabModal(true);
            } else {
              handleCreate();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${activeTab === "slabs" && isCreateSlabDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={activeTab === "slabs" && isCreateSlabDisabled}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {activeTab === "slabs" ? "Create Slab" : "Create Structure"}
        </button>
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border bg-yellow-100">
                    Base Amount
                  </th>
                  {allSlabs.map((slab) => (
                    <th
                      key={slab.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border"
                    >
                      {slab.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">
                    Installment 1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">
                    Installment 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeesStructures
                  .sort((a, b) => {
                    if (!a.class?.name || !b.class?.name) return 0;
                    const getNum = (name: string) => parseInt(name.replace(/[^0-9]/g, ''), 10) || 0;
                    return getNum(a.class.name) - getNum(b.class.name);
                  })
                  .map((fs) => {
                    const className = fs.class?.name || '-';
                    const baseAmount = fs.components.reduce((sum, comp) => sum + (comp.baseAmount ?? 0), 0);
                    const numInstalments = fs.numberOfInstalments || 0;
                    return (
                      <tr key={fs.class?.id || Math.random()}>
                        <td className="px-4 py-3 whitespace-nowrap border">{className}</td>
                        <td className="px-4 py-3 whitespace-nowrap border font-bold bg-yellow-50 text-yellow-800">
                          ₹ {baseAmount.toLocaleString()}
                        </td>
                        {allSlabs.map((slab) => {
                          const mapping = fs.feesSlabMappings?.find((m) => m.feesSlabId === slab.id);
                          let adjusted = baseAmount;
                          if (mapping) {
                            const concessionable = fs.components.filter((c) => c.isConcessionApplicable);
                            const concession = concessionable.reduce(
                              (sum, c) => sum + (c.baseAmount ?? 0) * (mapping.feeConcessionRate / 100),
                              0,
                            );
                            adjusted = baseAmount - concession;
                          }
                          return (
                            <td key={slab.id} className="px-4 py-3 whitespace-nowrap border">
                              <div>₹ {adjusted.toLocaleString()}</div>
                              {mapping && mapping.feeConcessionRate > 0 && (
                                <div className="text-xs font-bold text-green-700 bg-green-100 rounded px-1 mt-1 inline-block">
                                  {mapping.feeConcessionRate}%
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 whitespace-nowrap border">
                          {numInstalments >= 1 ? `₹ ${(baseAmount / numInstalments).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border">
                          {numInstalments >= 2 ? `₹ ${(baseAmount / numInstalments).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border">
                          <button
                            className="text-purple-600 hover:text-purple-800 mr-2"
                            onClick={() => handleEdit(fs)}
                            title="Edit"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 whitespace-nowrap border">Total</td>
                  <td className="px-4 py-3 whitespace-nowrap border bg-yellow-200 text-yellow-900 text-lg">
                    ₹{" "}
                    {filteredFeesStructures
                      .reduce((sum, fs) => sum + fs.components.reduce((s, c) => s + (c.baseAmount ?? 0), 0), 0)
                      .toLocaleString()}
                  </td>
                  {allSlabs.map((slab) => {
                    const total = filteredFeesStructures.reduce((sum, fs) => {
                      const baseAmount = fs.components.reduce((s, c) => s + (c.baseAmount ?? 0), 0);
                      const mapping = fs.feesSlabMappings?.find((m) => m.feesSlabId === slab.id);
                      let adjusted = baseAmount;
                      if (mapping) {
                        const concessionable = fs.components.filter((c) => c.isConcessionApplicable);
                        const concession = concessionable.reduce(
                          (s, c) => s + (c.baseAmount ?? 0) * (mapping.feeConcessionRate / 100),
                          0,
                        );
                        adjusted = baseAmount - concession;
                      }
                      return sum + adjusted;
                    }, 0);
                    return (
                      <td
                        key={slab.id}
                        className="px-4 py-3 whitespace-nowrap border bg-green-100 text-green-900 text-lg"
                      >
                        ₹ {total.toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap border">
                    ₹{" "}
                    {filteredFeesStructures
                      .reduce((sum, fs) => {
                        const baseAmount = fs.components.reduce((s, c) => s + (c.baseAmount ?? 0), 0);
                        const numInstalments = fs.numberOfInstalments || 0;
                        return sum + (numInstalments >= 1 ? baseAmount / numInstalments : 0);
                      }, 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border">
                    ₹{" "}
                    {filteredFeesStructures
                      .reduce((sum, fs) => {
                        const baseAmount = fs.components.reduce((s, c) => s + (c.baseAmount ?? 0), 0);
                        const numInstalments = fs.numberOfInstalments || 0;
                        return sum + (numInstalments >= 2 ? baseAmount / numInstalments : 0);
                      }, 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add New Fee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

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
                <button className="flex-1 py-1.5 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium">
                  Add Fee
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeeStructureForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <FeeStructureForm
            onClose={() => setShowFeeStructureForm(false)}
            onSubmit={handleFeeStructureSubmit}
            fieldsDisabled={modalFieldsDisabled}
            disabledSteps={[1, 2, 3]}
            formType={currentFeesStructure ? 'EDIT' : 'ADD'}
            selectedAcademicYear={selectedAcademicYear}
            selectedCourse={selectedCourse}
            initialStep={initialStep}
            // feesSlabMappings={slabYearMappings}
            feesStructure={currentFeesStructure}
            existingFeeStructures={filteredFeesStructures}
            existingCourses={availableCourses}
          />
        </div>
      )}

      {showSlabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{slabEditMode ? "Edit Slab" : "Create Slab"}</h2>
              <button onClick={handleSlabModalClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {/* <SlabForm
              allSlabs={allSlabs}
              initialData={editingSlabMapping}
              academicYearId={selectedAcademicYear?.id}
              onSubmit={handleSlabSubmit}
              onClose={handleSlabModalClose}
              editMode={slabEditMode}
            /> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesStructurePage;
