import { Check, GraduationCap } from "lucide-react";
import { Step } from "../types";
import Image from "next/image";

interface ProgressTimelineProps {
  currentStep: number;
  steps: Step[];
}

export default function ProgressTimeline({ currentStep, steps }: ProgressTimelineProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Logo Section - Now at top */}
      <div className="mb-4 flex items-center gap-4 px-2">
        <div className="rounded-lg overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
          <Image
            src="/besc-logo.jpeg"
            alt="BESC Logo"
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg"
            priority
          />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-lg font-extrabold text-white tracking-tight leading-tight">BESC Admissions</span>
          <span className="text-xs text-white/60 font-medium mt-0.5">Student Console</span>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="flex-1 flex items-center justify-center">
        {/* Mobile Horizontal Timeline */}
        <div className="lg:hidden w-full">
          <div className="grid grid-cols-5 gap-0 px-1">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center relative group">
                {/* Step Circle */}
                <div className="relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-lg ${
                      currentStep > step.number
                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white transform scale-105"
                        : currentStep === step.number
                        ? "bg-white text-purple-600 transform scale-110 ring-4 ring-white/30"
                        : "bg-white/10 text-white border-2 border-white/30 group-hover:border-white/50"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Pulse animation for current step */}
                  {currentStep === step.number && (
                    <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-25"></div>
                  )}
                </div>

                {/* Step Content */}
                <div className="mt-1.5 text-center">
                  <h3
                    className={`text-[11px] font-semibold transition-colors duration-200 line-clamp-1 tracking-tight ${
                      currentStep >= step.number ? "text-white" : "text-white/70"
                    }`}
                  >
                    {step.title.split(' ').map((word, i) => (
                      <span key={i} className="inline-block">
                        {word}
                        {i < step.title.split(' ').length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </h3>
                  <div className="mt-1 h-[18px] flex items-center justify-center">
                    {currentStep > step.number ? (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-green-500/20 text-green-100 border border-green-400/30 whitespace-nowrap">
                        <Check className="w-2 h-2 mr-0.5" />
                        Done
                      </span>
                    ) : currentStep === step.number ? (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-white/20 text-white border border-white/30 whitespace-nowrap">
                        <div className="w-1 h-1 bg-white rounded-full mr-0.5 animate-pulse"></div>
                        Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-white/10 text-white/70 border border-white/20 whitespace-nowrap">
                        Next
                      </span>
                    )}
                  </div>
                </div>

                {/* Horizontal connecting line */}
                {index < steps.length - 1 && (
                  <div className="absolute right-[-50%] top-3.5 w-full h-0.5 bg-white/20">
                    <div
                      className={`w-full transition-all duration-500 ${
                        currentStep > step.number
                          ? "bg-gradient-to-r from-green-500 to-green-400"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Vertical Timeline */}
        <div className="hidden lg:flex flex-col space-y-8 w-full">
          <div className="flex items-center justify-center gap-2 mb-4 mt-2">
            <GraduationCap className="w-6 h-6 text-white" />
            <h2 className="text-[16px] font-bold text-white">ADMISSION 2025-2026</h2>
          </div>
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-start relative group">
              {/* Step Circle */}
              <div className="relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-300 shadow-lg ${
                    currentStep > step.number
                      ? "bg-gradient-to-br from-green-400 to-green-600 text-white transform scale-105"
                      : currentStep === step.number
                      ? "bg-white text-purple-600 transform scale-110 ring-4 ring-white/30"
                      : "bg-white/10 text-white border-2 border-white/30 group-hover:border-white/50"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Pulse animation for current step */}
                {currentStep === step.number && (
                  <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-25"></div>
                )}
              </div>

              {/* Step Content */}
              <div className="ml-4 flex-1">
                <h3
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentStep >= step.number ? "text-white" : "text-white/70"
                  }`}
                >
                  {step.title}
                </h3>
                <div className="mt-1.5">
                  {currentStep > step.number ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-100 border border-green-400/30">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  ) : currentStep === step.number ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                      <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div>
                      Current
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Vertical connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-12 bg-white/20">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentStep > step.number
                        ? "bg-gradient-to-b from-green-500 to-green-400"
                        : "bg-white/20"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
