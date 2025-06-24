import React, { useState, useEffect } from "react";
import { AcademicSetup } from "./steps/AcademicSetup";
import { SlabCreation } from "./steps/SlabCreation";
import { FeeConfiguration } from "./steps/FeeConfiguration";
import { PreviewSimulation } from "./steps/PreviewSimulation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { FeesStructureDto, FeesSlabYear, AcademicYear, FeesSlab, FeesHead, FeesReceiptType } from "../../../types/fees";
import { Course } from "../../../types/academics/course";
// import { Degree } from "../../../types/resources/degree";
import { Stream } from "../../../types/academics/stream";

interface FeeStructureFormProps {
  onClose: () => void;
  onSubmit: (data: { feesStructure: FeesStructureDto, feesSlabYears: FeesSlabYear[] }) => void;
  fieldsDisabled?: boolean;
  disabledSteps?: number[];
  selectedAcademicYear?: AcademicYear | null;
  selectedCourse?: Course | null;
  initialStep?: number;
  feesStructure?: FeesStructureDto | null;
}

// const stepImages = [
//   '/academic-year.png',        // Step 1: Academic Setup (public folder)
//   '/fees-slab-year.png',      // Step 2: Slab Creation (public folder)
//   '/fees-structure.png',      // Step 3: Fee Configuration (public folder)
//   '/preview.png',             // Step 4: Preview & Simulation (public folder)
// ];

const steps = [
  { number: 1, title: "Academic Setup", description: "Select academic year and course details.", image: "/academic-year.png" },
  { number: 2, title: "Slab Creation", description: "Define concession slabs for the fee structure.", image: "/fees-slab-year.png" },
  { number: 3, title: "Fee Configuration", description: "Configure fee components and academic parameters.", image: "/fees-structure.png" },
  { number: 4, title: "Preview & Simulation", description: "Review and simulate the generated fee structure.", image: "/preview.png" },
];

// Add a mockStream for default values
const mockStream: Stream = {
  id: 1,
  name: 'Default Stream',
  level: 'UNDER_GRADUATE',
  framework: 'CCF',
  degree: {
    id: 1,
    name: 'Default Degree',
    level: 'UNDER_GRADUATE',
    sequence: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  degreeProgramme: 'HONOURS',
  duration: 3,
  numberOfSemesters: 6,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FeeStructureForm: React.FC<FeeStructureFormProps> = ({ onClose, onSubmit,initialStep = 1, feesStructure }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Use the provided feesStructure as initial state if present
  const [formFeesStructure, setFormFeesStructure] = useState<FeesStructureDto>(
    feesStructure || {
      closingDate: new Date(),
      semester: 1,
      advanceForSemester: 1,
      startDate: new Date(),
      endDate: new Date(),
      onlineStartDate: new Date(),
      onlineEndDate: new Date(),
      numberOfInstalments: null,
      instalmentStartDate: null,
      instalmentEndDate: null,
      feesReceiptTypeId: null,
      academicYear: {
        id: undefined,
        startYear: new Date(),
        endYear: new Date(),
        isCurrentYear: false,
      },
      course: {
        id: undefined,
        name: "",
        stream: mockStream,
        shortName: null,
        codePrefix: null,
        universityCode: null,
      },
      advanceForCourse: null,
      components: [],
    }
  );

  const [feesSlabYears, setFeesSlabYears] = useState<FeesSlabYear[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [slabs, setSlabs] = useState<FeesSlab[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeesHead[]>([]);
  const [feesReceiptTypes, setFeesReceiptTypes] = useState<FeesReceiptType[]>([]);

  useEffect(() => {
    setCurrentStep(initialStep);
    if (feesStructure) setFormFeesStructure(feesStructure);

    // Mock fetching data
    const mockCourses: Course[] = [
      { id: 1, name: "B.Com Morning", stream: mockStream, shortName: 'BCOM', codePrefix: 'BCM', universityCode: '123' },
      { id: 2, name: "B.Sc Computer Science", stream: mockStream, shortName: 'BSCCS', codePrefix: 'BCC', universityCode: '456' },
      { id: 3, name: "B.A. English", stream: mockStream, shortName: 'BAENG', codePrefix: 'BAE', universityCode: '789' },
    ];
    const mockAcademicYears: AcademicYear[] = [
      { id: 1, startYear: new Date("2023-01-01"), endYear: new Date("2024-01-01"), isCurrentYear: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, startYear: new Date("2024-01-01"), endYear: new Date("2025-01-01"), isCurrentYear: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, startYear: new Date("2025-01-01"), endYear: new Date("2026-01-01"), isCurrentYear: false, createdAt: new Date(), updatedAt: new Date() },
    ];
    const mockSlabs: FeesSlab[] = [
        { id: 1, name: "Merit Based", description: null, sequence: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Income Based", description: null, sequence: 2, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: "Sibling Discount", description: null, sequence: 3, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: "Staff Ward", description: null, sequence: 4, createdAt: new Date(), updatedAt: new Date() },
        { id: 5, name: "Special Case", description: null, sequence: 5, createdAt: new Date(), updatedAt: new Date() },
    ];
    const mockFeeHeads: FeesHead[] = [
        { id: 1, name: "Tuition Fee", sequence: 1, remarks: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Development Fee", sequence: 2, remarks: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: "Library Fee", sequence: 3, remarks: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: "Sports Fee", sequence: 4, remarks: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    const mockFeesReceiptTypes: FeesReceiptType[] = [
        { id: 1, name: 'Academic Fee', chk: null, chkMisc: null, printChln: null, splType: null, addOnId: null, printReceipt: null, chkOnline: null, chkOnSequence: null },
        { id: 2, name: 'Miscellaneous Fee', chk: null, chkMisc: null, printChln: null, splType: null, addOnId: null, printReceipt: null, chkOnline: null, chkOnSequence: null },
        { id: 3, name: 'Admission Fee', chk: null, chkMisc: null, printChln: null, splType: null, addOnId: null, printReceipt: null, chkOnline: null, chkOnSequence: null },
    ];
    setCourses(mockCourses);
    setAcademicYears(mockAcademicYears);
    setSlabs(mockSlabs);
    setFeeHeads(mockFeeHeads);
    setFeesReceiptTypes(mockFeesReceiptTypes);

    if (mockAcademicYears.length > 0 && mockSlabs.length >= 5) {
        const initialSlabYears: FeesSlabYear[] = mockSlabs.slice(0, 5).map(slab => ({
            feesSlabId: slab.id!,
            academicYearId: mockAcademicYears[0].id!,
            feeConcessionRate: 0,
        }));
        setFeesSlabYears(initialSlabYears);
    }
  }, [initialStep, feesStructure]);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    onSubmit({ feesStructure: formFeesStructure, feesSlabYears });
  };

  const currentStepData = steps.find(s => s.number === currentStep)!;

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-8xl w-full h-[95vh] mx-auto flex overflow-hidden">
      {/* Step Illustration Panel */}
      <div className="hidden md:flex flex-col w-96 h-full bg-gray-50 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
          <p className="text-sm text-gray-600">{currentStepData.description}</p>
        </div>

        {/* Multi-step progress bar */}
        <div className="relative flex justify-between items-center mb-12 w-full">
          {/* The line connecting the steps */}
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-200" />
          <div
            className="absolute top-4 left-0 h-1 bg-purple-600 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
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
          <img
            src={currentStepData.image}
            alt="Step Illustration"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>

      {/* Form Content Panel */}
      <div className="flex-1 flex flex-col p-8">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Step content here */}
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
              feesSlabYears={feesSlabYears}
              setFeesSlabYears={setFeesSlabYears}
              slabs={slabs}
              setSlabs={setSlabs}
              academicYearId={formFeesStructure.academicYear!.id}
            />
          )}
          {currentStep === 3 && (
            <FeeConfiguration
              feesStructure={formFeesStructure}
              setFeesStructure={setFormFeesStructure}
              feeHeads={feeHeads}
              courses={courses}
              feesReceiptTypes={feesReceiptTypes}
            />
          )}
          {currentStep === 4 && (
            <PreviewSimulation
              feesStructure={formFeesStructure}
              feeHeads={feeHeads}
              slabs={slabs}
              feesSlabYears={feesSlabYears}
              feesReceiptTypes={feesReceiptTypes}
            />
          )}
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
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
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
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
