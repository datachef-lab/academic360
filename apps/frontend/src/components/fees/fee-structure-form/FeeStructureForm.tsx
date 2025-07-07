import React, { useState, useEffect } from "react";
import { AcademicSetup } from "./steps/AcademicSetup";
import { SlabCreation } from "./steps/SlabCreation";
import { FeeConfiguration } from "./steps/FeeConfiguration";
import { PreviewSimulation } from "./steps/PreviewSimulation";
import { DatesStep } from "./steps/DatesStep";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { 
  FeesStructureDto,  CreateFeesStructureDto } from "../../../types/fees";
import {AcademicYear} from "@/types/academics/academic-year"
import { Course } from "../../../types/academics/course";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useFeesSlabs, useFeesHeads, useFeesReceiptTypes } from "@/hooks/useFees";
import { useShifts } from "@/hooks/useShifts";
import { getAllCourses } from "@/services/course-api";
import { getAllClasses } from "@/services/classes.service";
import { Class } from "@/types/academics/class";
// import { PlusOutlined, DeleteOutlined, CloseCircleTwoTone, CheckCircleTwoTone } from "@ant-design/icons";
import { FeesComponent, Instalment } from '@/types/fees';

interface FeeStructureFormProps {
  onClose: () => void;
  onSubmit: (givenFeesStructure: FeesStructureDto | CreateFeesStructureDto, formType: "ADD" | "EDIT") => Promise<void>
  fieldsDisabled?: boolean;
  disabledSteps?: number[];
  selectedAcademicYear?: AcademicYear | null;
  selectedCourse?: Course | null;
  initialStep?: number;
  feesStructure?: FeesStructureDto | CreateFeesStructureDto | null;
  existingFeeStructures?: FeesStructureDto[];
  existingCourses: Course[];
  formType: 'ADD' | 'EDIT';
}

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
    title: "Dates",
    description: "Set up all important fee-related dates.",
    image: "/fees-dates.png",
  },
  {
    number: 5,
    title: "Preview & Simulation",
    description: "Review and simulate the generated fee structure.",
    image: "/preview.png",
  },
];

// Utility to get total base amount from components
const getTotalBaseAmount = (components: FeesComponent[] = []) => (components || []).reduce((sum: number, c: FeesComponent) => sum + (c.baseAmount || 0), 0);
// Utility to get total base amount from installments
const getTotalInstalmentAmount = (instalments: Instalment[] = []) => (instalments || []).reduce((sum: number, i: Instalment) => sum + (i.baseAmount || 0), 0);

const FeeStructureForm: React.FC<FeeStructureFormProps> = ({
  onClose,
  onSubmit,
  initialStep = 1,
  feesStructure,
  existingFeeStructures = [],
  formType,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formFeesStructureAdd, setFormFeesStructureAdd] = useState<CreateFeesStructureDto>(
    (feesStructure as CreateFeesStructureDto) || {
      closingDate: new Date(),
      class: { id: 0, name: '', type: 'SEMESTER', sequence: 1, disabled: false },
      advanceForSemester: null,
      startDate: new Date(),
      endDate: new Date(),
      onlineStartDate: new Date(),
      onlineEndDate: new Date(),
      numberOfInstalments: null,
      instalments: [],
      feesReceiptTypeId: null,
      academicYear: undefined,
      courses: [],
      advanceForCourse: null,
      components: [],
      shift: null,
      feesSlabMappings: [],
    }
  );
  const [formFeesStructureEdit, setFormFeesStructureEdit] = useState<FeesStructureDto>(
    (feesStructure as FeesStructureDto) || {
      closingDate: new Date(),
      class: { id: 0, name: '', type: 'SEMESTER', sequence: 1, disabled: false },
      advanceForSemester: null,
      startDate: new Date(),
      endDate: new Date(),
      onlineStartDate: new Date(),
      onlineEndDate: new Date(),
      numberOfInstalments: null,
      instalments: [],
      feesReceiptTypeId: null,
      academicYear: undefined,
      course: { id: 0, degree: null, name: '', shortName: '', codePrefix: '', universityCode: '' },
      advanceForCourse: null,
      components: [],
      shift: null,
      feesSlabMappings: [],
    }
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data from hooks/services
  const { data: academicYears = [], isLoading: academicYearsLoading } = useAcademicYears();
  const { feesSlabs, loading: slabsLoading } = useFeesSlabs();
  const { feesHeads, loading: headsLoading } = useFeesHeads();
  const { feesReceiptTypes, loading: receiptTypesLoading } = useFeesReceiptTypes();
  const { shifts, loading: shiftsLoading } = useShifts();

  useEffect(() => {
    setCurrentStep(initialStep);
    if (feesStructure) {
      if (formType === 'ADD') {
        setFormFeesStructureAdd(feesStructure as CreateFeesStructureDto);
      } else {
        setFormFeesStructureEdit(feesStructure as FeesStructureDto);
      }
    }
  }, [initialStep, feesStructure, formType]);

  useEffect(() => {
    getAllCourses().then((res) => {
      if (res && res.payload) {
        setCourses(res.payload);
      }
    });
  }, []);

  useEffect(() => {
    getAllClasses().then((data) => {
      console.log("classes response data:", data);
      setClasses(data.payload)
    });
  }, []);

  useEffect(() => {
    if (
      currentStep === 2 &&
      feesSlabs.length > 0 &&
      (formFeesStructureAdd as CreateFeesStructureDto).feesSlabMappings.length === 0
    ) {
      setFormFeesStructureAdd(prev => ({...prev, 
        feesSlabMappings: feesSlabs.map((slab) => ({
          id: slab.id!,
          feesSlabId: slab.id!,
          feesStructureId: 0, // Placeholder, update as needed
          feeConcessionRate: 0,
        }))
      }));
    }
  }, [currentStep, feesSlabs, (formFeesStructureAdd as CreateFeesStructureDto).feesSlabMappings.length, setFormFeesStructureAdd]);

  // Validation logic for each step
  const validateStep = () => {
    if (currentStep === 1) {
      if (formType === 'ADD') {
        if (!formFeesStructureAdd.academicYear?.id) {
          setError("Please select an academic year.");
          return false;
        }
        if (!formFeesStructureAdd.courses.length) {
          setError("Please select at least one course.");
          return false;
        }
      } else {
        if (!formFeesStructureEdit.academicYear?.id) {
          setError("Please select an academic year.");
          return false;
        }
        if (!formFeesStructureEdit.course?.id) {
          setError("Please select a course.");
          return false;
        }
      }
    }
    if (currentStep === 2) {
      if (formType === 'ADD') {
        if (!formFeesStructureAdd.feesSlabMappings.length) {
          setError("Please add at least one slab.");
          return false;
        }
      } else {
        if (!formFeesStructureEdit.feesSlabMappings.length) {
          setError("Please add at least one slab.");
          return false;
        }
      }
    }
    if (currentStep === 3) {
      if (formType === 'ADD') {
        if (!formFeesStructureAdd.class) {
          setError("Please select a class.");
          return false;
        }
        if (!formFeesStructureAdd.shift) {
          setError("Please select a shift.");
          return false;
        }
        if (!formFeesStructureAdd.feesReceiptTypeId) {
          setError("Please select a fees receipt type.");
          return false;
        }
        if (!formFeesStructureAdd.components.length) {
          setError("Please add at least one fee component.");
          return false;
        }
        if (formFeesStructureAdd.components.some((c) => !c.feesHeadId || c.baseAmount === undefined)) {
          setError("All fee components must have a fee head and amount.");
          return false;
        }
      } else {
        if (!formFeesStructureEdit.class) {
          setError("Please select a class.");
          return false;
        }
        if (!formFeesStructureEdit.shift) {
          setError("Please select a shift.");
          return false;
        }
        if (!formFeesStructureEdit.feesReceiptTypeId) {
          setError("Please select a fees receipt type.");
          return false;
        }
        if (!formFeesStructureEdit.components.length) {
          setError("Please add at least one fee component.");
          return false;
        }
        if (formFeesStructureEdit.components.some((c) => !c.feesHeadId || c.baseAmount === undefined)) {
          setError("All fee components must have a fee head and amount.");
          return false;
        }
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      if (formType === 'ADD') {
        const cleanedFeesSlabMappings = formFeesStructureAdd.feesSlabMappings.map(({ id, ...rest }) => {console.log(id); return rest});
        onSubmit({ ...formFeesStructureAdd, feesSlabMappings: cleanedFeesSlabMappings }, formType);
      } else {
        onSubmit(formFeesStructureEdit, formType);
      }
    } catch {
      setError('Error submitting fee structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepData = steps.find((s) => s.number === currentStep)!;

  const isFeeConfigNextDisabled = (
    (currentStep === 3 && (
      !formFeesStructureAdd.class ||
      !formFeesStructureAdd.shift ||
      !formFeesStructureAdd.feesReceiptTypeId ||
      !formFeesStructureAdd.components.length ||
      formFeesStructureAdd.components.some((c) => !c.feesHeadId)
    )) ||
    (currentStep === 4 && (() => {
      // Only apply for ADD mode
      if (formType !== 'ADD') return false;
      const hasInstallments = formFeesStructureAdd.numberOfInstalments === 2;
      if (!hasInstallments) return false;
      const totalBaseAmount = getTotalBaseAmount(formFeesStructureAdd.components);
      const totalInstalmentAmount = getTotalInstalmentAmount(formFeesStructureAdd.instalments);
      return totalBaseAmount !== totalInstalmentAmount;
    })())
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
        <div className="relative flex justify-between items-center mb-4 w-full">
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
                className={`mt-1 text-xs text-center font-semibold ${
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
            formType === 'ADD' ? (
              <AcademicSetup
                feesStructure={formFeesStructureAdd}
                setFeesStructure={setFormFeesStructureAdd}
                courses={courses}
                academicYears={academicYears}
                classes={classes}
                shifts={shifts}
                formType={formType}
              />
            ) : (
              <AcademicSetup
                feesStructure={formFeesStructureEdit}
                setFeesStructure={setFormFeesStructureEdit}
                courses={courses}
                academicYears={academicYears}
                classes={classes}
                shifts={shifts}
                formType={formType}
              />
            )
          )}
          {currentStep === 2 && (
            formType === 'ADD' ? (
              <SlabCreation<CreateFeesStructureDto>
                feesSlabMappings={formFeesStructureAdd.feesSlabMappings}
                setFormFeesStructure={setFormFeesStructureAdd}
                slabs={feesSlabs}
              />
            ) : (
              <SlabCreation<FeesStructureDto>
                feesSlabMappings={formFeesStructureEdit.feesSlabMappings}
                setFormFeesStructure={setFormFeesStructureEdit}
                slabs={feesSlabs}
              />
            )
          )}
          {currentStep === 3 && (
            formType === 'ADD' ? (
              <FeeConfiguration
                formType="ADD"
                courses={courses}
                feesStructure={formFeesStructureAdd}
                setFeesStructure={setFormFeesStructureAdd}
                feeHeads={feesHeads}
                feesReceiptTypes={feesReceiptTypes}
                shifts={shifts}
                existingFeeStructures={existingFeeStructures}
                classes={classes}
              />
            ) : (
              <FeeConfiguration
                formType="EDIT"
                courses={courses}
                feesStructure={formFeesStructureEdit}
                setFeesStructure={setFormFeesStructureEdit}
                feeHeads={feesHeads}
                feesReceiptTypes={feesReceiptTypes}
                shifts={shifts}
                existingFeeStructures={existingFeeStructures}
                classes={classes}
              />
            )
          )}
          {currentStep === 4 && (
            formType === 'ADD' ? (
              <DatesStep
                formType="ADD"
                feesStructure={formFeesStructureAdd}
                setFeesStructure={setFormFeesStructureAdd}
              />
            ) : (
              <DatesStep
                formType="EDIT"
                feesStructure={formFeesStructureEdit}
                setFeesStructure={setFormFeesStructureEdit}
              />
            )
          )}
          {currentStep === 5 && (
            formType === 'ADD' ? (
              <PreviewSimulation
                feesStructure={formFeesStructureAdd}
                feeHeads={feesHeads}
                slabs={feesSlabs}
                feesSlabMappings={formFeesStructureAdd.feesSlabMappings}
                feesReceiptTypes={feesReceiptTypes}
              />
            ) : (
              <PreviewSimulation
                feesStructure={formFeesStructureEdit}
                feeHeads={feesHeads}
                slabs={feesSlabs}
                feesSlabMappings={formFeesStructureEdit.feesSlabMappings}
                feesReceiptTypes={feesReceiptTypes}
              />
            )
          )}
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || !!(formFeesStructureAdd.id && formFeesStructureAdd.id > 0)}
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
              {currentStep === 5 ? (
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
