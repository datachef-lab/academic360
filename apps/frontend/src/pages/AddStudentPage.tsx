import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Book,
  IdCard,
  Users,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  School,
  Building,
  Heart,
  AlertTriangle,
  StepForward,
} from "lucide-react";
import PersonalDetailsForm from "@/components/forms/student/PersonalDetailsForm";

import HealthDetailsForm from "@/components/forms/student/HealthDetailsForm";
import EmergencyContactForm from "@/components/forms/student/EmergencyContactForm";
import AcademicHistoryForm from "@/components/forms/student/AcademicHistoryForm";
import AcademicIdentifierForm from "@/components/forms/student/AcademicIdentifierForm";
import AccommodationForm from "@/components/forms/student/AccommodationForm";
import { PersonalDetails } from "@/types/user/personal-details";
import { Health } from "@/types/user/health";
import { EmergencyContact } from "@/types/user/emergency-contact";
import { AcademicHistory } from "@/types/user/academic-history";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import { Accommodation } from "@/types/user/accommodation";
import { Parent } from "@/types/user/parent";
import FamilyDetailsForm from "@/components/forms/student/FamilyDetailsForm";
import { AddressDetailsForm } from "@/components/forms/student/AdressDetailsForm";
import { Address } from "@/types/resources/address";
import { Student } from "@/types/user/student";
import { useStudentSubmission } from '@/hooks/useStudentSubmission';
import { toast } from "sonner";


export interface StudentFormData {
  personalDetails: PersonalDetails;
  familyDetails: Parent;
  addressDetails: Address;
  healthDetails: Health;
  emergencyContact: EmergencyContact;
  academicHistory: AcademicHistory;
  academicIdentifier: AcademicIdentifier;
  accommodation: Accommodation;
}

const steps = [
  {
    title: "Personal Details",
    icon: <IdCard className="w-5 h-5" />,
    activeIcon: <IdCard className="w-5 h-5 text-blue-600" />,
    content: PersonalDetailsForm,
    key: "personalDetails",
  },
  {
    title: "Family Details",
    icon: <Users className="w-5 h-5" />,
    activeIcon: <Users className="w-5 h-5 text-blue-600" />,
    content: FamilyDetailsForm,
    key: "familyDetails",
  },
  {
    title: "Address Details",
    icon: <Users className="w-5 h-5" />,
    activeIcon: <Users className="w-5 h-5 text-blue-600" />,
    content: AddressDetailsForm,
    key: "addressDetails",
  },

  {
    title: "Health Details",
    icon: <Heart className="w-5 h-5" />,
    activeIcon: <Heart className="w-5 h-5 text-blue-600" />,
    content: HealthDetailsForm,
    key: "healthDetails",
  },
  {
    title: "Emergency Contact",
    icon: <AlertCircle className="w-5 h-5" />,
    activeIcon: <AlertCircle className="w-5 h-5 text-blue-600" />,
    content: EmergencyContactForm,
    key: "emergencyContact",
  },
  {
    title: "Academic History",
    icon: <Book className="w-5 h-5" />,
    activeIcon: <Book className="w-5 h-5 text-blue-600" />,
    content: AcademicHistoryForm,
    key: "academicHistory",
  },
  {
    title: "Academic Identifiers",
    icon: <School className="w-5 h-5" />,
    activeIcon: <School className="w-5 h-5 text-blue-600" />,
    content: AcademicIdentifierForm,
    key: "academicIdentifier",
  },
  {
    title: "Accommodation",
    icon: <Building className="w-5 h-5" />,
    activeIcon: <Building className="w-5 h-5 text-blue-600" />,
    content: AccommodationForm,
    key: "accommodation",
  },
];

export default function AddStudentPage() {
  const [current, setCurrent] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { submitStudentData } = useStudentSubmission({
    // onSuccess: () => {
    //   // Reset form after successful submission
    //   setCurrent(0);
    //   setCompletedSteps([]);
    //   setFormData({
    //     personalDetails: {} as PersonalDetails,
    //     familyDetails: {} as Parent,
    //     addressDetails: {} as Address,
    //     healthDetails: {} as Health,
    //     emergencyContact: {} as EmergencyContact,
    //     academicHistory: {} as AcademicHistory,
    //     academicIdentifier: {} as academicIdentifier,
    //     accommodation: {} as Accommodation,
    //   });
    // }
  });
 
  const [formData, setFormData] = useState<StudentFormData>({
    personalDetails: {} as PersonalDetails,
    familyDetails: {} as Parent,
    addressDetails: {} as Address,
    healthDetails: {} as Health,
    emergencyContact: {} as EmergencyContact,
    academicHistory: {} as AcademicHistory,
    academicIdentifier: {} as AcademicIdentifier,
    accommodation: {} as Accommodation,
  });

  // Validate if all required steps are completed
  const isAllStepsCompleted = completedSteps.length === steps.length;

  // Handle browser refresh/back button
  useEffect(() => {
    const savedFormData = localStorage.getItem("studentFormData");
    const savedCurrentStep = localStorage.getItem("currentStep");
    const savedCompletedSteps = localStorage.getItem("completedSteps");

    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
    if (savedCurrentStep) {
      setCurrent(parseInt(savedCurrentStep));
    }
    if (savedCompletedSteps) {
      setCompletedSteps(JSON.parse(savedCompletedSteps));
    }

    // Cleanup on unmount
    return () => {
      localStorage.removeItem("studentFormData");
      localStorage.removeItem("currentStep");
      localStorage.removeItem("completedSteps");
    };
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("studentFormData", JSON.stringify(formData));
    localStorage.setItem("currentStep", current.toString());
    localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
  }, [formData, current, completedSteps]);

  const next = () => {
    if (current < steps.length - 1) {
      if (!completedSteps.includes(current)) {
        toast.warning(
          "Please complete the current step before proceeding",
          {
            icon: <AlertTriangle className="text-yellow-500" />,
          }
        );
        return;
      }

      setCurrent(current + 1);
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps((prev) => [...prev, stepIndex]);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking only on completed steps or the current step
    if (completedSteps.includes(stepIndex) || stepIndex <= current) {
      setCurrent(stepIndex);
    } else {
      toast.warning(
        "Please complete the previous steps first",
        {
          icon: <AlertTriangle className="text-yellow-500" />,
        }
      );
    }
  };

  const handleFormSubmit = async (
    stepIndex: number,
    data:
      | PersonalDetails
      | Parent
      | Health
      | EmergencyContact
      | AcademicHistory
      | AcademicIdentifier
      | Accommodation
      | Address
      | { student?: Student; personalDetails: PersonalDetails },
  ) => {
    try {
      const stepKey = steps[stepIndex].key as keyof StudentFormData;
      
      // Handle special case for personal details form
      if (stepKey === "personalDetails" && "personalDetails" in data) {
        setFormData((prev) => ({
          ...prev,
          personalDetails: data.personalDetails,
        }));
       
      } else {
        setFormData((prev) => ({
          ...prev,
          [stepKey]: data,
        }));
     
      }

      handleStepComplete(stepIndex);
      
      // Auto-proceed to next step if not the last step
      if (stepIndex < steps.length - 1) {
        setTimeout(() => {
          setCurrent(stepIndex + 1);
        }, 500);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message, {
          icon: <AlertCircle className="text-red-500" />,
        });
      } else {
        toast.error("Failed to submit form. Please try again.", {
          icon: <AlertCircle className="text-red-500" />,
        });
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!isAllStepsCompleted) {
      toast.error("Please complete all steps before submitting", {
        icon: <AlertCircle className="text-red-500" />,
      });
      return;
    }

    try {
      await submitStudentData(formData);
        // Reset form after successful submission
        // console.log(JSON.stringify(formData,null,2));
        // setCurrent(0);
        // setCompletedSteps([]);
        // setFormData({
        //   personalDetails: {} as PersonalDetails,
        //   familyDetails: {  } as Parent,
        //   addressDetails: {} as Address,
        //   healthDetails: {} as Health,
        //   emergencyContact: {} as EmergencyContact,
        //   academicHistory: {} as AcademicHistory,
        //   academicIdentifier: {} as academicIdentifier,
        //   accommodation: {} as Accommodation,
        // });
    } catch (error) {
      // Error handling is already done in the hook
      console.error('Failed to submit student data:', error);
    
    }
  };

  const CurrentForm = steps[current].content;
  const currentStepKey = steps[current].key as keyof StudentFormData;

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-4 bg-white/30 backdrop-blur-sm"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl shadow-lg"
          >
            <StepForward className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Add Students</h2>
            <p className="text-sm text-teal-600 font-medium">Complete the multi-step form to register students </p>
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-teal-400 via-teal-500 to-teal-400 rounded-full origin-left col-span-full"
        />
      </motion.div>
      <div className="max-w-auto mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-xl font-bold">Add New Student</h1>
              <p className="text-blue-100 ">Complete all steps to register a new student</p>
            </motion.div>
          </div>

          <div className="grid border rounded-xl grid-cols-1 lg:grid-cols-4 gap-0  ">
            {/* Stepper - Left Column */}
            <div className="lg:col-span-1  p-6 border-r border-gray-200 ">
             <div className="mt-8 ">
             <div className="relative ">
                {/* Animated Progress Line */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute left-5 top-0 h-full w-0.5 bg-gray-200 origin-top"
                >
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: completedSteps.length / steps.length }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
                    className="h-full w-full bg-blue-500 origin-top"
                  />
                </motion.div>

                <div className="space-y-8 pl-8">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleStepClick(index)}
                      className={`flex items-start gap-4 cursor-pointer transition-all duration-200 ${
                        current === index
                          ? "text-blue-600"
                          : completedSteps.includes(index)
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                          current === index
                            ? "bg-blue-100"
                            : completedSteps.includes(index)
                              ? "bg-green-100"
                              : "bg-gray-100"
                        }`}
                      >
                        {completedSteps.includes(index) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : current === index ? (
                          step.activeIcon
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-medium ${
                            current === index
                              ? "text-blue-600"
                              : completedSteps.includes(index)
                                ? "text-green-600"
                                : "text-gray-700"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={`text-sm ${
                            current === index
                              ? "text-blue-400"
                              : completedSteps.includes(index)
                                ? "text-green-400"
                                : "text-gray-400"
                          }`}
                        >
                          {completedSteps.includes(index) ? "Completed" : current === index ? "In Progress" : "Pending"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
             </div>
            </div>

            {/* Form Content - Right Column */}
            <div className="lg:col-span-3 p-6">
              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-2 bg-gray-100 rounded-full mb-8 origin-left"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: (current + 1) / steps.length }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500 rounded-full origin-left"
                />
              </motion.div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      completedSteps.includes(current) ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {completedSteps.includes(current) ? <CheckCircle2 className="w-6 h-6" /> : steps[current].icon}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">{steps[current].title}</h2>
                </div>
                <p className="text-gray-500 ml-12">Please fill in the required information</p>
              </div>

              <div>
                <div className="ml-8 overflow-auto max-h-[60vh] overflow-y-auto ">
                  <CurrentForm
                    onSubmit={(data) => handleFormSubmit(current, data)}
                    initialData={
                      formData[currentStepKey] as
                        | PersonalDetails
                        | Parent
                        | Health
                        | EmergencyContact
                        | AcademicHistory
                        | AcademicIdentifier
                        | Accommodation
                        | Address
                    }
                  />
                </div>

             
              </div>
   {/* Navigation Buttons */}
              <div className="flex justify-between mt-12 pt-6 border-t border-gray-200">
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prev}
                  disabled={current === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                    current === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </motion.button>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  Step {current + 1} of {steps.length}
                </div>

                {current === steps.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinalSubmit}
                    disabled={!isAllStepsCompleted}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                      !isAllStepsCompleted
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 hover:shadow-md"
                    }`}
                  >
                    Complete Registration
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={next}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-md"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
