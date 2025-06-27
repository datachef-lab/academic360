import React, { useState, useEffect } from "react";
import { AcademicSetup } from "./steps/AcademicSetup";
import { SlabCreation } from "./steps/SlabCreation";
import { FeeConfiguration } from "./steps/FeeConfiguration";
import { PreviewSimulation } from "./steps/PreviewSimulation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { FeesStructureDto, AcademicYear } from "../../../types/fees";
import { Course } from "../../../types/academics/course";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useFeesSlabs, useFeesHeads, useFeesReceiptTypes } from "@/hooks/useFees";
import { useShifts } from "@/hooks/useShifts";
import { getAllCourses } from "@/services/course-api";
import { checkFeesStructureExists } from '@/services/fees-api';
// import axiosInstance from "@/utils/api";
// import { Shift } from "@/types/resources/shift";

interface FeeStructureFormProps {
  onClose: () => void;
  onSubmit: (data: FeesStructureDto) => void;
  fieldsDisabled?: boolean;
  disabledSteps?: number[];
  selectedAcademicYear?: AcademicYear | null;
  selectedCourse?: Course | null;
  initialStep?: number;
  // feesSlabMappings: FeesSlabMapping[];
  feesStructure?: FeesStructureDto | null;
  existingFeeStructures?: FeesStructureDto[];
  existingCourses: Course[];
}

// const stepImages = [
//   '/academic-year.png',        // Step 1: Academic Setup (public folder)
//   '/fees-slab-year.png',      // Step 2: Slab Creation (public folder)
//   '/fees-structure.png',      // Step 3: Fee Configuration (public folder)
//   '/preview.png',             // Step 4: Preview & Simulation (public folder)
// ];

const steps = [
  {
    number: 1,
    title: "Academic Setup",
    description: "Select academic year and course details.",
    image: "/academic-year.png",
  },
  {
    number: 2,
    title: "Slab Creation",
    description: "Define concession slabs for the fee structure.",
    image: "/fees-slab-year.png",
  },
  {
    number: 3,
    title: "Fee Configuration",
    description: "Configure fee components and academic parameters.",
    image: "/fees-structure.png",
  },
  {
    number: 4,
    title: "Preview & Simulation",
    description: "Review and simulate the generated fee structure.",
    image: "/preview.png",
  },
];

const FeeStructureForm: React.FC<FeeStructureFormProps> = ({
  onClose,
  // existingCourses,
  onSubmit,
  initialStep = 1,
  feesStructure,
  existingFeeStructures = [],
  // feesSlabMappings: initialFeesSlabMappings,
  // ...props
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formFeesStructure, setFormFeesStructure] = useState<FeesStructureDto>(
    feesStructure || {
      closingDate: new Date(),
      semester: null,
      advanceForSemester: null,
      startDate: new Date(),
      endDate: new Date(),
      onlineStartDate: new Date(),
      onlineEndDate: new Date(),
      numberOfInstalments: null,
      instalmentStartDate: null,
      instalmentEndDate: null,
      feesReceiptTypeId: null,
      academicYear: undefined,
      course: undefined,
      advanceForCourse: null,
      components: [],
      shift: null,
      feesSlabMappings: [],
    },
  );
  // const [feesSlabMappings, setFeesSlabMappings] = useState<FeesSlabMapping[]>(feesStructure?.feesSlabMappings!);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const [slabs, setSlabs] = useState<FeesSlab[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data from hooks/services
  const { data: academicYears = [], isLoading: academicYearsLoading } = useAcademicYears();
  const { feesSlabs, loading: slabsLoading } = useFeesSlabs();
  const { feesHeads, loading: headsLoading } = useFeesHeads();
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();
  const { shifts, loading: shiftsLoading } = useShifts();

 

  useEffect(() => {
    setCurrentStep(initialStep);
    if (feesStructure) setFormFeesStructure(feesStructure);
  }, [initialStep, feesStructure]);

  useEffect(() => {
    getAllCourses().then((res) => {
      if (res && res.payload) {
        setCourses(res.payload);
      }
    });
  }, []);

  useEffect(() => {
    if (
      currentStep === 2 &&
      feesSlabs.length > 0 &&
      formFeesStructure.feesSlabMappings.length === 0
    ) {
      setFormFeesStructure(prev => ({...prev, 
        feesSlabMappings: feesSlabs.map((slab) => ({
          id: slab.id!,
          feesSlabId: slab.id!,
          feesStructureId: 0, // Placeholder, update as needed
          feeConcessionRate: 0,
        }))
      }));
    }
  }, [currentStep, feesSlabs, formFeesStructure.feesSlabMappings.length, setFormFeesStructure]);

  // Validation logic for each step
  const validateStep = () => {
    if (currentStep === 1) {
      if (!formFeesStructure.academicYear?.id) {
        setError("Please select an academic year.");
        return false;
      }
      if (!formFeesStructure.course?.id) {
        setError("Please select a course.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formFeesStructure.feesSlabMappings.length) {
        setError("Please add at least one slab.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formFeesStructure.semester) {
        setError("Please select a semester.");
        return false;
      }
      if (!formFeesStructure.shift) {
        setError("Please select a shift.");
        return false;
      }
      if (!formFeesStructure.feesReceiptTypeId) {
        setError("Please select a fees receipt type.");
        return false;
      }
      if (!formFeesStructure.components.length) {
        setError("Please add at least one fee component.");
        return false;
      }
      if (formFeesStructure.components.some((c) => !c.feesHeadId || c.amount === undefined)) {
        setError("All fee components must have a fee head and amount.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      if (!formFeesStructure.id) {
        // Remove 'id' from each feesSlabMapping before submit
        const cleanedFeesSlabMappings = formFeesStructure.feesSlabMappings.map(({ id, ...rest }) => { console.log(id); return rest});
        // const payload = {
        //   ...formFeesStructure,
        //   feesSlabMappings: cleanedFeesSlabMappings,
        // };
        // Duplicate check
        const checkPayload = {
          academicYearId: formFeesStructure.academicYear?.id,
          courseId: formFeesStructure.course?.id,
          semester: formFeesStructure.semester,
          shiftId: formFeesStructure.shift?.id,
          feesReceiptTypeId: formFeesStructure.feesReceiptTypeId,
        };
        const res = await checkFeesStructureExists(checkPayload);
        if (res.exists) {
          setError('A fee structure with the same Academic Year, Course, Semester, Shift, and Receipt Type already exists.');
          setSubmitting(false);
          return;
        }
        onSubmit({ ...formFeesStructure, feesSlabMappings: cleanedFeesSlabMappings });
      } else {
        onSubmit(formFeesStructure);
      }
    } catch {
      setError('Error checking for duplicate fee structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepData = steps.find((s) => s.number === currentStep)!;

  const isFeeConfigNextDisabled = currentStep === 3 && (
    !formFeesStructure.semester ||
    !formFeesStructure.shift ||
    !formFeesStructure.feesReceiptTypeId ||
    !formFeesStructure.components.length ||
    formFeesStructure.components.some((c) => !c.feesHeadId)
  );

  if (academicYearsLoading || slabsLoading || headsLoading || receiptTypesLoading || shiftsLoading) {
    return <div className="flex items-center justify-center h-64 text-lg">Loading form data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-8xl w-full h-[95vh] mx-auto flex overflow-hidden">
      {/* Step Illustration Panel */}
      <div className="hidden md:flex flex-col w-96 h-full bg-gray-50 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
          <p className="text-sm text-gray-600">{currentStepData.description}</p>
        </div>
        <div className="relative flex justify-between items-center mb-12 w-full">
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-200" />
          <div
            className="absolute top-4 left-0 h-1 bg-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step) => (
            <div key={step.number} className="z-10 flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold transition-all duration-300 ${
                  currentStep >= step.number ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-900"
                }`}
              >
                {step.number}
              </div>
              <p
                className={`mt-2 text-xs text-center font-semibold ${
                  currentStep >= step.number ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
        <div className="flex-grow flex items-center justify-center min-h-0">
          <img src={currentStepData.image} alt="Step Illustration" className="max-h-full max-w-full object-contain" />
        </div>
      </div>
      {/* Form Content Panel */}
      <div className="flex-1 flex flex-col p-8">
        <div className="flex-1 flex flex-col min-h-0">
          {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
          {currentStep === 1 && (
            <AcademicSetup
              feesStructure={formFeesStructure}
              setFeesStructure={setFormFeesStructure}
              courses={courses}
              academicYears={academicYears}
            />
          )}
          {currentStep === 2 && (
            <SlabCreation
              feesSlabMappings={formFeesStructure.feesSlabMappings}
              setFormFeesStructure={setFormFeesStructure}
              slabs={feesSlabs}
              academicYearId={formFeesStructure.academicYear?.id}
            />
          )}
          {currentStep === 3 && (
            <FeeConfiguration
              courses={courses}
              feesStructure={formFeesStructure}
              setFeesStructure={setFormFeesStructure}
              feeHeads={feesHeads}
              feesReceiptTypes={feesReceiptTypes}
              shifts={shifts}
              existingFeeStructures={existingFeeStructures}
            />
          )}
          {currentStep === 4 && (
            <PreviewSimulation
              feesStructure={formFeesStructure}
              feeHeads={feesHeads}
              slabs={feesSlabs}
              feesSlabMappings={formFeesStructure.feesSlabMappings}
              feesReceiptTypes={feesReceiptTypes}
            />
          )}
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || !!(formFeesStructure.id && formFeesStructure.id > 0)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              {currentStep === 4 ? (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  disabled={isFeeConfigNextDisabled}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeStructureForm;
