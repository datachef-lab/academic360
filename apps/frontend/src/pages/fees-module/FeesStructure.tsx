import React, { useState, useEffect,  } from "react";
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
import FeeStructureForm from "../../components/fees/fee-structure-form/FeeStructureForm";
// import { getAllCourses } from "../../services/course-api";
import { Course } from "@/types/academics/course";
import { FeesStructureDto, AcademicYear, FeesSlabMapping, FeesSlab } from "../../types/fees";
import { useFeesStructures, useAcademicYearsFromFeesStructures, useCoursesFromFeesStructures } from "@/hooks/useFees";
import { useFeesSlabMappings, useFeesReceiptTypes } from "@/hooks/useFees";
import { checkSlabsExistForAcademicYear, getFeesStructuresByAcademicYearAndCourse } from "@/services/fees-api";
import axiosInstance from "@/utils/api";
import { useShifts } from "@/hooks/useShifts";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Shift } from '@/types/resources/shift';
import { FeesReceiptType } from '@/types/fees';
// import { SlabCreation } from "../../components/fees/fee-structure-form/steps/SlabCreation";

// interface SlabManagementProps {
//   showModal: boolean;
//   setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
//   feesSlabMappings: FeesSlabMapping[];
//   setFeesSlabMappings: React.Dispatch<React.SetStateAction<FeesSlabMapping[]>>;
//   allSlabs: FeesSlab[];
// }

// const SlabManagement: React.FC<SlabManagementProps & { onEdit: (slabMapping: FeesSlabMapping) => void }> = ({  feesSlabMappings, allSlabs, onEdit }) => {
//   // No local data state, use props

//   // Helper to get slab details
//   const getSlabDetails = (feesSlabId: number) => allSlabs.find(slab => slab.id === feesSlabId);

//   // Table rendering
//   return (
//     <div>
//       <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
//         <div className="flex flex-col gap-3">
//           <div className="flex flex-wrap gap-2">
//             {/* ...filters and export buttons if needed... */}
//           </div>
//         </div>
//       </div>
//       <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Concession Rate (%)</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {feesSlabMappings.map((mapping, idx) => {
//               const slab = getSlabDetails(mapping.feesSlabId);
//               return (
//                 <tr key={mapping.id || mapping.feesSlabId}>
//                   <td className="px-4 py-3">{idx + 1}</td>
//                   <td className="px-4 py-3">{slab?.name || '-'}</td>
//                   <td className="px-4 py-3">{slab && 'disabled' in slab && typeof (slab as Record<string, unknown>).disabled === 'boolean' ? ((slab as Record<string, boolean>).disabled ? 'Disabled' : 'Enabled') : 'Enabled'}</td>
//                   <td className="px-4 py-3">{mapping.feeConcessionRate}%</td>
//                   <td className="px-4 py-3">
//                     <button className="text-purple-600 hover:text-purple-800 mr-2" onClick={() => onEdit(mapping)}>
//                       Edit
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// interface SlabFormProps {
//   allSlabs: FeesSlab[];
//   initialData: FeesSlabMapping | null;
//   academicYearId: number | undefined;
//   onSubmit: (slabMapping: FeesSlabMapping) => Promise<void>;
//   onClose: () => void;
//   editMode: boolean;
// }

// const SlabForm: React.FC<SlabFormProps> = ({ allSlabs, initialData, academicYearId, onSubmit, onClose, editMode }) => {
//   const [feesSlabId, setFeesSlabId] = useState<number | ''>(initialData?.feesSlabId || '');
//   const [feeConcessionRate, setFeeConcessionRate] = useState<number>(initialData?.feeConcessionRate || 0);
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!feesSlabId || !academicYearId) return;
//     setLoading(true);
//     await onSubmit({
//       ...(initialData?.id ? { id: initialData.id } : {}),
//       feesSlabId: Number(feesSlabId),
//       feesStructureId: 0, // Placeholder, update as needed
//       feeConcessionRate: Number(feeConcessionRate),
//     } as FeesSlabMapping);
//     setLoading(false);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Slab Name</label>
//         <select
//           value={feesSlabId}
//           onChange={e => setFeesSlabId(Number(e.target.value))}
//           className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//           disabled={editMode}
//         >
//           <option value="">Select Slab</option>
//           {allSlabs.map((slab: FeesSlab) => (
//             <option key={slab.id} value={slab.id}>{slab.name}</option>
//           ))}
//         </select>
//             </div>
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Fee Concession Rate (%)</label>
//               <input
//           type="number"
//           min={0}
//           max={100}
//           value={feeConcessionRate}
//           onChange={e => setFeeConcessionRate(Number(e.target.value))}
//           className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//               />
//             </div>
//       <div className="flex gap-2 mt-4">
//         <button
//           type="submit"
//           disabled={loading || !feesSlabId}
//           className="flex-1 py-2 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
//         >
//           {editMode ? 'Update Slab' : 'Create Slab'}
//         </button>
//         <button
//           type="button"
//           onClick={onClose}
//           className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors font-medium"
//         >
//               Cancel
//         </button>
//     </div>
//     </form>
//   );
// };

const FeesStructure: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
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
  const {
    loading: feesLoading,
    addFeesStructure,
    updateFeesStructureById,
  } = useFeesStructures();
  const { addFeesSlabMappings } = useFeesSlabMappings();
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();

  // Use the new hooks
  const { academicYears, loading: academicYearsLoading } = useAcademicYearsFromFeesStructures();
  const { courses: coursesForSelectedYear } = useCoursesFromFeesStructures(selectedAcademicYear?.id ?? null);

  // Select most recent academic year and first course by default
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[0]);
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (coursesForSelectedYear.length > 0 && !selectedCourse) {
      setSelectedCourse(coursesForSelectedYear[0]);
    } else if (coursesForSelectedYear.length === 0) {
      setSelectedCourse(null);
    }
  }, [coursesForSelectedYear, selectedCourse]);

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
      const res = await axiosInstance.get<FeesSlab[]>('/api/v1/fees/slabs');
      setAllSlabs(res.data);

    } catch (error) {
      console.log(error);
      setAllSlabs([]);
    }
  }

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
    const tmpSelectedFeesReceiptType = feesReceiptTypes.find(ele => ele.id === id);

    // Filter by the newly selected receipt type
    const tmpFilteredFeesStructures = feesStructures.filter(ele => (
      ele.feesReceiptTypeId === id
    ));

    setSelectedReceiptType(tmpSelectedFeesReceiptType ?? null);
    setFilteredFeesStructures(tmpFilteredFeesStructures);
    setSelectedShift(null); // Reset shift when receipt type changes
  };

  const handleShiftChange = (value: string) => {
    const id = Number(value);
    const tmpSelectedShift = shifts.find(ele => ele.id === id);

    // Filter by both the selected receipt type and the newly selected shift
    const tmpFilteredFeesStructures = feesStructures.filter(ele => (
      ele.feesReceiptTypeId === (selectedReceiptType?.id ?? 0) &&
      ele.shift?.id === id
    ));

    setSelectedShift(tmpSelectedShift ?? null);
    setFilteredFeesStructures(tmpFilteredFeesStructures);
  };

  const fetchAvailableCourses = async (
    academicYearId: number | undefined,
    allCourses: Course[],
    setAvailableCourses: React.Dispatch<React.SetStateAction<Course[]>>
  ) => {
    if (typeof academicYearId !== 'number') {
      setAvailableCourses([]);
      return;
    }
    const filtered: Course[] = [];
    for (const course of allCourses) {
      if (typeof course.id !== 'number') continue;
      if (typeof academicYearId !== 'number') continue;
      const structures = await getFeesStructuresByAcademicYearAndCourse(academicYearId, course.id);
      if (!structures || structures.length === 0) {
        filtered.push(course);
      } else {
        filtered.push(course);
      }
    }
    setAvailableCourses(filtered);
  };


  const handleFeeStructureSubmit = async (givenFeesStructure: FeesStructureDto) => {
    console.log("Fee Structure Form Data:", givenFeesStructure);
    try {
      // Duplicate check (for create only)
      if (!currentFeesStructure?.id) {
        const duplicate = filteredFeesStructures.find(fs =>
          fs.academicYear?.id === givenFeesStructure.academicYear?.id &&
          fs.course?.id === givenFeesStructure.course?.id &&
          fs.semester === givenFeesStructure.semester &&
          fs.shift?.id === givenFeesStructure.shift?.id &&
          fs.feesReceiptTypeId === givenFeesStructure.feesReceiptTypeId
        );
        if (duplicate) {
          alert("A fee structure with the same Academic Year, Course, Semester, Shift, and Receipt Type already exists.");
          return;
        }
      }
      if (givenFeesStructure.feesSlabMappings.length > 0) {
        await addFeesSlabMappings(givenFeesStructure.feesSlabMappings);
      }
      if (currentFeesStructure?.id) {
        await updateFeesStructureById(currentFeesStructure.id, givenFeesStructure);
      } else {
        const created = await addFeesStructure(givenFeesStructure);
        if (created) {
          setSelectedAcademicYear(created.academicYear ?? null);
          setSelectedCourse(created.course ?? null);

          const tmpSelectedFeesReceiptType = feesReceiptTypes.find(ele => ele.id == created.feesReceiptTypeId!)!
          setSelectedReceiptType(tmpSelectedFeesReceiptType);
          setSelectedShift(created.shift!);

          const tmpFilteredFeesStructures =  feesStructures.filter(ele => (
            ele.feesReceiptTypeId === tmpSelectedFeesReceiptType?.id &&
            ele.shift?.id === created.shift?.id
          ));

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
      console.log("fetching fees structures: -")
      const res = await axiosInstance.get<FeesStructureDto[]>(`/api/v1/fees/structure/by-academic-year-and-course/${selectedAcademicYear!.id}/${selectedCourse!.id}`);
      setFeesStructures(res.data || []);
      console.log("fetching fees structures, res.data: -", res.data)

      if (res.data.length > 0) {      
        const tmpSelectedFeesReceiptType = feesReceiptTypes.find(ele => ele.id == res.data[0].feesReceiptTypeId);
        console.log("tmpSelectedFeesReceiptType:", tmpSelectedFeesReceiptType);
        const tmpArr = res.data.filter(ele => ele.feesReceiptTypeId == tmpSelectedFeesReceiptType?.id);
        console.log("tmpArr:", tmpArr);
        const tmpSelectedShift =  tmpArr[0].shift;
        console.log("tmpSelectedShift:", tmpSelectedShift)
        const tmpFilteredFeesStructures =  tmpArr.filter(ele => (
          ele.feesReceiptTypeId === tmpSelectedFeesReceiptType?.id &&
          ele.shift?.id === tmpSelectedShift?.id
        ));
        console.log("tmpFilteredFeesStructures:", tmpFilteredFeesStructures);
        setSelectedReceiptType(tmpSelectedFeesReceiptType!);
        setSelectedShift(tmpSelectedShift!);
        setFilteredFeesStructures(tmpFilteredFeesStructures);


      }

    } catch (error) {
      console.log(error);
      setFilteredFeesStructures([]);
    }
  }

  useEffect(() => {
    if (selectedAcademicYear?.id && selectedCourse?.id) {
      fetchFeesStructures();
    } else {
      setFilteredFeesStructures([]);
    }
  }, [selectedAcademicYear, selectedCourse]);

  // Slab modal handlers
  // const openCreateSlabModal = () => {
  //   setEditingSlabMapping(null);
  //   setSlabEditMode(false);
  //   setShowSlabModal(true);
  // };
  // const openEditSlabModal = (slabMapping: FeesSlabMapping) => {
  //   setEditingSlabMapping(slabMapping);
  //   setSlabEditMode(true);
  //   setShowSlabModal(true);
  // };
  const handleSlabModalClose = () => {
    setShowSlabModal(false);
    setEditingSlabMapping(null);
    setSlabEditMode(false);
  };
  // Slab create/update submit
  // const handleSlabSubmit = async (slabMapping: FeesSlabMapping) => {
  //   try {
  //     if (slabEditMode && slabMapping.id) {
  //       // Update
  //       await axiosInstance.put(`/api/v1/fees/slab-year-mappings/${slabMapping.id}`, slabMapping);
  //       toast.success("Slab updated successfully");
  //     } else {
  //       // Create
  //       await axiosInstance.post(`/api/v1/fees/slab-year-mappings`, slabMapping);
  //       toast.success("Slab created successfully");
  //     }
  //     await fetchSlabsYear();
  //     handleSlabModalClose();
  //   } catch  {
  //     toast.error("Error saving slab");
  //   }
  // };

  const availableSlabsToCreate = allSlabs.filter(
    slab => !slabYearMappings.some(mapping => mapping.feesSlabId === slab.id)
  );
  const isCreateSlabDisabled = availableSlabsToCreate.length === 0;

  const toRoman = (num: number | null | undefined) => {
    if (!num) return '';
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    return romans[num - 1] || num;
  };

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
              <Select value={selectedAcademicYear?.id ? String(selectedAcademicYear.id) : "all"} onValueChange={val => {
                const year = academicYears.find(y => String(y.id) === val);
                setSelectedAcademicYear(year || null);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={String(year.id)}>{year.startYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
              <Select value={selectedCourse?.id ? String(selectedCourse.id) : "all"} onValueChange={val => {
                const course = coursesForSelectedYear.find(c => String(c.id) === val);
                setSelectedCourse(course || null);
              }}>
                <SelectTrigger className="w-40" disabled={!selectedAcademicYear}>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map(course => (
                    <SelectItem key={course.id} value={String(course.id)}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Structure
            </button> */}
          </div>
        </div>
        {/* <div className="flex gap-4 py-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Type</label>
            <Select value={selectedReceiptType != null ? String(selectedReceiptType) : "all"} onValueChange={val => setSelectedReceiptType(val === "all" ? null : Number(val))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Array.from(new Set(filteredFeesStructures.map(fs => fs.feesReceiptTypeId)))
                  .filter(id => id != null)
                  .map(id => {
                    const rt = feesReceiptTypes.find(rt => rt.id === id);
                    return rt ? (
                      <SelectItem key={rt.id} value={String(rt.id)}>{rt.name}</SelectItem>
                    ) : null;
                  })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
            <Select value={selectedShift != null ? String(selectedShift) : "all"} onValueChange={val => setSelectedShift(val === "all" ? null : Number(val))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Array.from(new Set(filteredFeesStructures.map(fs => fs.shift?.id)))
                  .filter(id => id != null)
                  .map(id => {
                    const shift = shifts.find(s => s.id === id);
                    return shift ? (
                      <SelectItem key={shift.id} value={String(shift.id)}>{shift.name}</SelectItem>
                    ) : null;
                  })}
              </SelectContent>
            </Select>
          </div>
        </div> */}
      </div>

      <div className="border-b border-gray-200 flex items-center justify-between">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <div className="flex items-center gap-4 py-2">
            {/* <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={selectedAcademicYear?.id || ""}
                onChange={e => {
                  const year = academicYears.find(y => y.id === Number(e.target.value));
                  setSelectedAcademicYear(year || null);
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.startYear}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
              <select
                value={selectedCourse?.id || ""}
                onChange={e => {
                  const course = coursesForSelectedYear.find(c => c.id === Number(e.target.value));
                  setSelectedCourse(course || null);
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!selectedAcademicYear}
              >
                <option value="">Select Course</option>
                {coursesForSelectedYear.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div> */}
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
                    .filter(rt => feesStructures.some(fs => fs.feesReceiptTypeId === rt.id))
                    .map(rt => (
                      <SelectItem key={rt.id} value={String(rt.id)}>{rt.name}</SelectItem>
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
                    .filter(shft => feesStructures.some(fs => fs.feesReceiptTypeId === selectedReceiptType?.id && fs.shift?.id === shft.id))
                    .map(shft => (
                      <SelectItem key={shft.id} value={String(shft.id)}>{shft.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </nav>
        <button
          onClick={() => {
            if (activeTab === 'slabs') {
              setShowSlabModal(true);
            } else {
              handleCreate();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${activeTab === 'slabs' && isCreateSlabDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={activeTab === 'slabs' && isCreateSlabDisabled}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {activeTab === 'slabs' ? 'Create Slab' : 'Create Structure'}
        </button>
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">Semester</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border bg-yellow-100">Base Amount</th>
                  {allSlabs.map(slab => (
                    <th key={slab.id} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">{slab.name}</th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">Installment 1</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">Installment 2</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeesStructures.sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0)).map(fs => {
                  const sem = fs.semester;
                  const baseAmount = fs.components.reduce((sum, comp) => sum + (comp.amount || 0), 0);
                  const numInstalments = fs.numberOfInstalments || 0;
                  return (
                    <tr key={sem}>
                      <td className="px-4 py-3 whitespace-nowrap border">Semester {toRoman(sem)}</td>
                      <td className="px-4 py-3 whitespace-nowrap border font-bold bg-yellow-50 text-yellow-800">₹ {baseAmount.toLocaleString()}</td>
                      {allSlabs.map(slab => {
                        const mapping = fs.feesSlabMappings?.find(m => m.feesSlabId === slab.id);
                        let adjusted = baseAmount;
                        if (mapping) {
                          const concessionable = fs.components.filter(c => c.isConcessionApplicable);
                          const concession = concessionable.reduce((sum, c) => sum + (c.amount * (mapping.feeConcessionRate / 100)), 0);
                          adjusted = baseAmount - concession;
                        }
                        return (
                          <td key={slab.id} className="px-4 py-3 whitespace-nowrap border">
                            <div>₹ {adjusted.toLocaleString()}</div>
                            {mapping && mapping.feeConcessionRate > 0 && (
                              <div className="text-xs font-bold text-green-700 bg-green-100 rounded px-1 mt-1 inline-block">{mapping.feeConcessionRate}%</div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap border">{numInstalments >= 1 ? `₹ ${(baseAmount / numInstalments).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap border">{numInstalments >= 2 ? `₹ ${(baseAmount / numInstalments).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap border">
                        <button className="text-purple-600 hover:text-purple-800 mr-2" onClick={() => handleEdit(fs)} title="Edit">
                          <Pencil className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 whitespace-nowrap border">Total</td>
                  <td className="px-4 py-3 whitespace-nowrap border bg-yellow-200 text-yellow-900 text-lg">₹ {filteredFeesStructures.reduce((sum, fs) => sum + fs.components.reduce((s, c) => s + (c.amount || 0), 0), 0).toLocaleString()}</td>
                  {allSlabs.map(slab => {
                    const total = filteredFeesStructures.reduce((sum, fs) => {
                      const baseAmount = fs.components.reduce((s, c) => s + (c.amount || 0), 0);
                      const mapping = fs.feesSlabMappings?.find(m => m.feesSlabId === slab.id);
                      let adjusted = baseAmount;
                      if (mapping) {
                        const concessionable = fs.components.filter(c => c.isConcessionApplicable);
                        const concession = concessionable.reduce((s, c) => s + (c.amount * (mapping.feeConcessionRate / 100)), 0);
                        adjusted = baseAmount - concession;
                      }
                      return sum + adjusted;
                    }, 0);
                    return <td key={slab.id} className="px-4 py-3 whitespace-nowrap border bg-green-100 text-green-900 text-lg">₹ {total.toLocaleString()}</td>;
                  })}
                  <td className="px-4 py-3 whitespace-nowrap border">₹ {filteredFeesStructures.reduce((sum, fs) => {
                    const baseAmount = fs.components.reduce((s, c) => s + (c.amount || 0), 0);
                    const numInstalments = fs.numberOfInstalments || 0;
                    return sum + (numInstalments >= 1 ? baseAmount / numInstalments : 0);
                  }, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap border">₹ {filteredFeesStructures.reduce((sum, fs) => {
                    const baseAmount = fs.components.reduce((s, c) => s + (c.amount || 0), 0);
                    const numInstalments = fs.numberOfInstalments || 0;
                    return sum + (numInstalments >= 2 ? baseAmount / numInstalments : 0);
                  }, 0).toLocaleString()}</td>
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
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
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
                <button
                  className="flex-1 py-1.5 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium"
                >
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
              <h2 className="text-lg font-bold text-gray-900">{slabEditMode ? 'Edit Slab' : 'Create Slab'}</h2>
              <button
                onClick={handleSlabModalClose}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
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

export default FeesStructure;
