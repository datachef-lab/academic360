import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  totalSteps: number;
  nextButtonDisabled?: boolean;
}

export default function NavigationButtons({
  currentStep,
  onPrevious,
  onNext,
  onSubmit,
  totalSteps,
  nextButtonDisabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
      <button
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentStep === 1
            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-1.5" />
        Previous
      </button>

      {currentStep < totalSteps ? (
        <button
          onClick={onNext}
          disabled={nextButtonDisabled}
          className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1.5" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-all duration-200 shadow-sm hover:shadow"
        >
          Submit Application
        </button>
      )}
    </div>
  );
}
