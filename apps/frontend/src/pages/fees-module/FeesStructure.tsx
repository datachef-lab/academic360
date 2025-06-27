import React, { useState, useEffect } from "react";
import {
  Banknote,
  PlusCircle,
  // Upload,
  X,
  AlertCircle,
  // Layers3,
  // CheckCircle,
  // XCircle,
  // Search,

} from "lucide-react";
import { toast } from "sonner";
import FeeStructureForm from "../../components/fees/fee-structure-form/FeeStructureForm";
// import { getAllCourses } from "../../services/course-api";
import { Course } from "@/types/academics/course";
import { FeesStructureDto, AcademicYear, FeesSlabYear, FeesSlab } from "../../types/fees";
import { useFeesStructures, useAcademicYearsFromFeesStructures, useCoursesFromFeesStructures } from "@/hooks/useFees";
import { useFeesSlabYears, useFeesReceiptTypes } from "@/hooks/useFees";
import { checkSlabsExistForAcademicYear } from "@/services/fees-api";
import axiosInstance from "@/utils/api";
// import { SlabCreation } from "../../components/fees/fee-structure-form/steps/SlabCreation";

interface SlabManagementProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  feesSlabYears: FeesSlabYear[];
  setFeesSlabYears: React.Dispatch<React.SetStateAction<FeesSlabYear[]>>;
  allSlabs: FeesSlab[];
}

const SlabManagement: React.FC<SlabManagementProps & { onEdit: (slabYear: FeesSlabYear) => void }> = ({  feesSlabYears, allSlabs, onEdit }) => {
  // No local data state, use props

  // Helper to get slab details
  const getSlabDetails = (feesSlabId: number) => allSlabs.find(slab => slab.id === feesSlabId);

  // Table rendering
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {/* ...filters and export buttons if needed... */}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Concession Rate (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feesSlabYears.map((mapping, idx) => {
              const slab = getSlabDetails(mapping.feesSlabId);
              return (
                <tr key={mapping.id || mapping.feesSlabId}>
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3">{slab?.name || '-'}</td>
                  <td className="px-4 py-3">{slab && 'disabled' in slab && typeof (slab as Record<string, unknown>).disabled === 'boolean' ? ((slab as Record<string, boolean>).disabled ? 'Disabled' : 'Enabled') : 'Enabled'}</td>
                  <td className="px-4 py-3">{mapping.feeConcessionRate}%</td>
                  <td className="px-4 py-3">
                    <button className="text-purple-600 hover:text-purple-800 mr-2" onClick={() => onEdit(mapping)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SlabFormProps {
  allSlabs: FeesSlab[];
  initialData: FeesSlabYear | null;
  academicYearId: number | undefined;
  onSubmit: (slabYear: FeesSlabYear) => Promise<void>;
  onClose: () => void;
  editMode: boolean;
}

const SlabForm: React.FC<SlabFormProps> = ({ allSlabs, initialData, academicYearId, onSubmit, onClose, editMode }) => {
  const [feesSlabId, setFeesSlabId] = useState<number | ''>(initialData?.feesSlabId || '');
  const [feeConcessionRate, setFeeConcessionRate] = useState<number>(initialData?.feeConcessionRate || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feesSlabId || !academicYearId) return;
    setLoading(true);
    await onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      feesSlabId: Number(feesSlabId),
      academicYearId,
      feeConcessionRate: Number(feeConcessionRate),
    } as FeesSlabYear);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slab Name</label>
        <select
          value={feesSlabId}
          onChange={e => setFeesSlabId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={editMode}
        >
          <option value="">Select Slab</option>
          {allSlabs.map((slab: FeesSlab) => (
            <option key={slab.id} value={slab.id}>{slab.name}</option>
          ))}
        </select>
            </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Concession Rate (%)</label>
              <input
          type="number"
          min={0}
          max={100}
          value={feeConcessionRate}
          onChange={e => setFeeConcessionRate(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={loading || !feesSlabId}
          className="flex-1 py-2 px-3 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
        >
          {editMode ? 'Update Slab' : 'Create Slab'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors font-medium"
        >
              Cancel
        </button>
    </div>
    </form>
  );
};

const FeesStructure: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [modalFieldsDisabled, setModalFieldsDisabled] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"fees" | "slabs">("fees");
  const [currentFeesStructure, setCurrentFeesStructure] = useState<FeesStructureDto | null>(null);
  const [initialStep, setInitialStep] = useState(1);
  const [slabYearMappings, setSlabYearMappings] = useState<FeesSlabYear[]>([]);
  const [slabsExistForYear, setSlabsExistForYear] = useState(false);
  const [allSlabs, setAllSlabs] = useState<FeesSlab[]>([]);
  const [filteredFeesStructures, setFilteredFeesStructures] = useState<FeesStructureDto[]>([]);
  const [slabEditMode, setSlabEditMode] = useState(false);
  const [editingSlabYear, setEditingSlabYear] = useState<FeesSlabYear | null>(null);

  // Use the fees API hook
  const { 
    
    loading: feesLoading, 
    addFeesStructure, 
    updateFeesStructureById, 
  } = useFeesStructures();
  const { addFeesSlabYears } = useFeesSlabYears();
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();

  // Use the new hooks
  const { academicYears, loading: academicYearsLoading } = useAcademicYearsFromFeesStructures();
  const { courses: coursesForSelectedYear, loading: coursesLoading } = useCoursesFromFeesStructures(selectedAcademicYear?.id ?? null);

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

  const fetchSlabsYear = async () => {
    try {
      console.log("fetching fees slabs")
      const res = await axiosInstance.get<FeesSlabYear[]>(`/api/v1/fees/slab-year-mappings?academicYearId=${selectedAcademicYear!.id}`);
      setSlabYearMappings(res.data);

    } catch (error) {
      console.log(error);
      setSlabYearMappings([]);
    }
  }


  useEffect(() => {
    if (selectedAcademicYear?.id) {
      console.log("in fetching slabs, selectedAcademicYear", selectedAcademicYear);
      fetchSlabs();

      fetchSlabsYear();
    } else {
      setAllSlabs([]);
      setSlabYearMappings([]);
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

  const handleFeeStructureSubmit = async (formData: { feesStructure: FeesStructureDto, feesSlabYears: FeesSlabYear[] }) => {
    console.log("Fee Structure Form Data:", formData);
    try {
      if (formData.feesSlabYears.length > 0) {
        await addFeesSlabYears(formData.feesSlabYears);
      }
      
      const { feesStructure } = formData;
      const apiData = feesStructure;

      if (currentFeesStructure?.id) {
        await updateFeesStructureById(currentFeesStructure.id, apiData);
      } else {
        await addFeesStructure(apiData);
      }
      setShowFeeStructureForm(false);
    } catch {
      // Error handled
    } finally {
      await fetchFeesStructures();
    }
  };

  const handleAdd = () => {
    if (!selectedAcademicYear || !selectedCourse) {
      toast.error("Please select both Academic Year and Course before adding a fee structure.");
      return;
    }

    if (!slabsExistForYear) {
      toast.error("Please create fee slabs for this academic year first", {
        description: "Navigate to the Slabs tab to create fee slabs.",
        duration: 5000,
      });
      setActiveTab("slabs"); // Switch to slabs tab
      return;
    }

    setModalFieldsDisabled(true);
    setCurrentFeesStructure({
      id: undefined,
      academicYear: selectedAcademicYear,
      course: selectedCourse,
      closingDate: new Date(),
      semester: 1,
      advanceForSemester: null,
      shift: null,
      feesReceiptTypeId: null,
      startDate: new Date(),
      endDate: new Date(),
      onlineStartDate: new Date(),
      onlineEndDate: new Date(),
      numberOfInstalments: null,
      instalmentStartDate: null,
      instalmentEndDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      advanceForCourse: null,
      components: [],
    });
    setShowFeeStructureForm(true);
    setInitialStep(3); // Skip to fee configuration since slabs exist
  };

  const handleEdit = (fs: FeesStructureDto) => {
    setModalFieldsDisabled(true);
    setCurrentFeesStructure(fs);
    setShowFeeStructureForm(true);
    setInitialStep(3);
  };

  const handleCreate = () => {
    setModalFieldsDisabled(false);
    setCurrentFeesStructure(null);
    setShowFeeStructureForm(true);
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
      setFilteredFeesStructures(res.data || [])

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
  //   setEditingSlabYear(null);
  //   setSlabEditMode(false);
  //   setShowSlabModal(true);
  // };
  const openEditSlabModal = (slabYear: FeesSlabYear) => {
    setEditingSlabYear(slabYear);
    setSlabEditMode(true);
    setShowSlabModal(true);
  };
  const handleSlabModalClose = () => {
    setShowSlabModal(false);
    setEditingSlabYear(null);
    setSlabEditMode(false);
  };
  // Slab create/update submit
  const handleSlabSubmit = async (slabYear: FeesSlabYear) => {
    try {
      if (slabEditMode && slabYear.id) {
        // Update
        await axiosInstance.put(`/api/v1/fees/slab-year-mappings/${slabYear.id}`, slabYear);
        toast.success("Slab updated successfully");
      } else {
        // Create
        await axiosInstance.post(`/api/v1/fees/slab-year-mappings`, slabYear);
        toast.success("Slab created successfully");
      }
      await fetchSlabsYear();
      handleSlabModalClose();
    } catch  {
      toast.error("Error saving slab");
    }
  };

  const availableSlabsToCreate = allSlabs.filter(
    slab => !slabYearMappings.some(mapping => mapping.feesSlabId === slab.id)
  );
  const isCreateSlabDisabled = availableSlabsToCreate.length === 0;

  if (academicYearsLoading || coursesLoading || feesLoading || receiptTypesLoading) {
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
            </div>
            <div className="self-end">
              <button
                onClick={handleAdd}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${(!selectedAcademicYear || !selectedCourse) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedAcademicYear || !selectedCourse}
              >
                <PlusCircle className="h-4 w-4" />
                Add Structure
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 flex items-center justify-between">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("fees")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'fees'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Fees Structure
          </button>
          <button
            onClick={() => setActiveTab("slabs")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'slabs'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Slabs
          </button>
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
        {activeTab === 'fees' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
            {filteredFeesStructures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sr. No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Receipt Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Base Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFeesStructures.map((fs, index) => {
                      const receiptTypeName = feesReceiptTypes.find(rt => rt.id === fs.feesReceiptTypeId)?.name || '-';
                      return (
                      <tr key={fs.id}>
                        <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fs.semester}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{receiptTypeName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">₹{fs.components.reduce((sum, comp) => sum + comp.amount, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fs.shift?.name || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="text-purple-600 hover:text-purple-800 mr-2" onClick={() => handleEdit(fs)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No fee structures found for the selected criteria.</p>
              </div>
            )}
          </div>
        ) : (
          <SlabManagement showModal={showSlabModal} setShowModal={setShowSlabModal} feesSlabYears={slabYearMappings} setFeesSlabYears={setSlabYearMappings} allSlabs={allSlabs} onEdit={openEditSlabModal} />
        )}
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
            existingCourses={coursesForSelectedYear}
          feesSlabYears={slabYearMappings}
          slabs={allSlabs}
            onClose={() => setShowFeeStructureForm(false)}
            onSubmit={handleFeeStructureSubmit}
            fieldsDisabled={modalFieldsDisabled}
            disabledSteps={[1, 2, 3]}
            feesStructure={currentFeesStructure}
            initialStep={initialStep}
            existingFeeStructures={filteredFeesStructures}
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
            <SlabForm
              allSlabs={allSlabs}
              initialData={editingSlabYear}
              academicYearId={selectedAcademicYear?.id}
              onSubmit={handleSlabSubmit}
              onClose={handleSlabModalClose}
              editMode={slabEditMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesStructure;
