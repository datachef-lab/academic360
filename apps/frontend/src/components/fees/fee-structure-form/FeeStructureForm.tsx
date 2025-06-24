import React, { useState } from "react";
import { AcademicSetup } from "./steps/AcademicSetup";
import { SlabCreation } from "./steps/SlabCreation";
import { FeeConfiguration } from "./steps/FeeConfiguration";
import { PreviewSimulation } from "./steps/PreviewSimulation";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface FeeStructureFormProps {
  onClose: () => void;
  onSubmit: (data: FeeStructureFormData) => void;
}

export interface FeeStructureFormData {
  academicSetup: {
    academicYear: string;
    feeCollectionDates: {
      startDate: string;
      endDate: string;
      onlineStartDate: string;
      onlineEndDate: string;
    };
  };
  slabs: Array<{
    id: number;
    slabType: string;
    concessionPercentage: number;
  }>;
  feeConfiguration: {
    course: string;
    semester: string;
    shift: string;
    advanceFor?: {
      course: string;
      semester: string;
      session: string;
    };
    components: Array<{
      id: number;
      feeHead: string;
      amount: number;
      sequence: number;
      concessionEligible: boolean;
      refundType: "Full" | "Forfeit";
      specialType: "Excess" | "Casual" | "Re-admission" | null;
      lateFeeType: string;
    }>;
  };
}

const FeeStructureForm: React.FC<FeeStructureFormProps> = ({ onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FeeStructureFormData>({
    academicSetup: {
      academicYear: "",
      feeCollectionDates: {
        startDate: "",
        endDate: "",
        onlineStartDate: "",
        onlineEndDate: "",
      },
    },
    slabs: [],
    feeConfiguration: {
      course: "",
      semester: "",
      shift: "",
      components: [],
    },
  });

  const updateFormData = (step: keyof FeeStructureFormData, data: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const steps = [
    { number: 1, title: "Academic Setup" },
    { number: 2, title: "Slab Creation" },
    { number: 3, title: "Fee Configuration" },
    { number: 4, title: "Preview & Simulation" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-auto">
      <div className="border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Fee Structure Configuration</h2>
          </div>
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    currentStep >= step.number ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`ml-2 text-sm font-semibold ${
                    currentStep >= step.number ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && <div className="mx-4 h-0.5 w-8 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentStep === 1 && (
          <AcademicSetup data={formData.academicSetup} onChange={(data) => updateFormData("academicSetup", data)} />
        )}
        {currentStep === 2 && <SlabCreation data={formData.slabs} onChange={(data) => updateFormData("slabs", data)} />}
        {currentStep === 3 && (
          <FeeConfiguration
            data={formData.feeConfiguration}
            onChange={(data) => updateFormData("feeConfiguration", data)}
          />
        )}
        {currentStep === 4 && <PreviewSimulation data={formData} />}
      </div>

      <div className="border-t border-gray-200 p-4">
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
  );
};

export default FeeStructureForm;
