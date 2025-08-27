"use client";
import { useEffect, useState } from "react";
import { Step } from "@/app/(besc)/admissions/[year]/types";
import {
  ProgressTimeline,
  GeneralInfoStep,
  AcademicInfoStep,
  CourseApplicationStep,
  AdditionalInfoStep,
  PaymentStep,
} from "@/app/(besc)/admissions/[year]/components";
import Image from "next/image";
// import { Admission, AdmissionGeneralInfo, ApplicationForm } from "@/db/schema";
// import { useParams, useRouter } from "next/navigation";
// import { AdmissionAcademicInfoDto, BoardUniversityDto } from "@/types/admissions";
// import { BoardUniversity, Payment, SportsInfo, StudentAcademicSubjects } from "@/db/schema";
import { useApplicationForm } from "@/hooks/use-application-form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ContinueApplicationModal } from "@/components/admissions/ContinueApplicationModal";
import { AdmissionAcademicInfoDto } from "@/types/admissions";

// Notes for each step
const stepNotes: Record<number, React.ReactNode> = {
  1: (
    <div>
      <div>
        <b>Please Note :</b>
      </div>
      <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
        <li>All the fields in the above Form are mandatory.</li>
        <li>
          Please cross check all the fields especially{" "}
          <b>Category, Gender & Mobile Number</b> before submitting the Form, as
          these fields are not editable afterwards.
        </li>
        <li>
          As per UGC directives in alignment with NEP 2020, all applicants
          seeking admission are required to create an Academic Bank of Credits
          (ABC) account. You will be required to submit this ABC ID at the time
          of registration to University of Calcutta.{" "}
          <a
            href="https://www.abc.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Click here to create your ABC ID.
          </a>
        </li>
        <li>
          For Indian citizens applying for admission, it is mandatory to possess
          an Aadhar Card. Kindly ensure that you have your Aadhar and related
          ready to prevent any delays in the admission process.
        </li>
        <li>
          <span className="text-red-600 font-bold">Red dot</span> indicates
          mandatory field.
        </li>
      </ol>
    </div>
  ),
  2: (
    <div>
      <b>Please Note :</b>
      <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
        <li>
          Candidates with "Pass Certificate Awarded" as their Class XII Board
          result are only eligible to apply.
        </li>
        <li>
          Fail / Compartmental students are not allowed to apply as per Calcutta
          University Norms.
        </li>
        <li>
          Fill-up your marks as per your class XII Board marksheet in the marks
          Entry option.
        </li>
        <li>
          In case your Board has not issued the Original Marksheet yet, you can
          proceed with your application by entering the marks as given in your
          Digital Marksheet.
        </li>
        <li>
          It is mandatory for students to provide the Original copy of the Class
          XII Board Marksheet at the time of document verification or when asked
          by the College, if selected.
        </li>
        <li>
          Applicants whose board is not listed in the drop-down, need to get an
          Equivalency Certificate from Equivalency Department of Calcutta
          University, College street campus.
        </li>
        <li>
          Once Board / Marks & Institute details are filled up, please click on
          Submit button to save and continue for course selection.
        </li>
        <li>
          <span className="text-red-600 font-bold">Red dot</span> indicates
          mandatory field.
        </li>
      </ol>
    </div>
  ),
  3: (
    <div>
      <b>Course Application Note:</b> Select your desired program and
      specialization carefully. Once submitted, changes may not be allowed.
    </div>
  ),
  4: (
    <div>
      <b>Please Note :</b>
      <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
        <li>
          Sr. No. 19 cannot be same as Mobile Number and Whatsapp Number given
          in Step 1.
        </li>
        <li>
          In case of Physically challanged being 'Yes', relevant documents will
          be required at the time of admission, if Selected.
        </li>
        <li>
          <span className="text-red-600 font-bold">Red dot</span> indicates
          mandatory field.
        </li>
      </ol>
    </div>
  ),
  5: (
    <div>
      <b>Payment Note:</b> Review your payment details before proceeding.
      Application fees are non-refundable.
    </div>
  ),
};

export default function AdmissionForm() {
  const { toast } = useToast();
  const { applicationForm, setApplicationForm } = useApplicationForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicInfo, setAcademicInfo] = useState<AdmissionAcademicInfoDto>({
    applicationFormId: 0,
    boardUniversityId: 0,
    boardResultStatus: "PASS",
    instituteId: 0,
    languageMediumId: 0,
    yearOfPassing: new Date().getFullYear(),
    streamType: "SCIENCE",
    isRegisteredForUgInCu: false,
    subjects: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (applicationForm?.admissionStep) {
      const stepMap: Record<string, number> = {
        GENERAL_INFORMATION: 1,
        ACADEMIC_INFORMATION: 2,
        COURSE_APPLICATION: 3,
        ADDITIONAL_INFORMATION: 4,
        PAYMENT: 5,
      };
      setCurrentStep(stepMap[applicationForm.admissionStep] || 1);
    }
  }, [applicationForm]);

  const steps: Step[] = [
    { number: 1, title: "General Information" },
    { number: 2, title: "Academic Information" },
    { number: 3, title: "Course Application" },
    { number: 4, title: "Additional Information" },
    { number: 5, title: "Payment" },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const renderStepContent = () => {
    console.log("application form in step content:", applicationForm)
    if (!applicationForm) return null;

    switch (currentStep) {
      case 1:
        return (
          <GeneralInfoStep
            stepNotes={stepNotes[currentStep]}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
          />
        );
      case 2:
        return (
          <AcademicInfoStep
            stepNotes={stepNotes[currentStep]}
            applicationForm={applicationForm}
            academicInfo={academicInfo}
            setAcademicInfo={setAcademicInfo}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
            currentStep={currentStep}
          />
        );
      case 3:
        if (!applicationForm) {
          return <div>Please complete all previous steps first.</div>;
        }
        return (
          <CourseApplicationStep
            stepNotes={stepNotes[currentStep]}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
            currentStep={currentStep}
          />
        );
      case 4:
        if (!applicationForm.generalInfo) {
          return <div>Please complete the general information step first.</div>;
        }
        return (
          <AdditionalInfoStep
            stepNotes={stepNotes[currentStep]}
            generalInfo={{
              applicationFormId: applicationForm.generalInfo.applicationFormId,
              firstName: applicationForm.generalInfo.firstName,
              dateOfBirth: applicationForm.generalInfo.dateOfBirth,
              password: applicationForm.generalInfo.password,
              whatsappNumber: applicationForm.generalInfo.whatsappNumber || undefined
            }}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
            currentStep={currentStep}
          />
        );
      case 5:
        if (!applicationForm) {
          return <div>Please complete all previous steps first.</div>;
        }
        return (
          <PaymentStep
            stepNotes={stepNotes[currentStep]}
            applicationForm={applicationForm}
            onPaymentInfoChange={(paymentInfo) => {
              console.log('Payment info changed:', paymentInfo);
              if (setApplicationForm) {
                setApplicationForm({
                  ...applicationForm,
                  paymentInfo
                });
              }
            }}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
            currentStep={currentStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Add Continue Application Button */}
      <div className="absolute top-4 right-4 z-50">
        {(!applicationForm?.id || applicationForm.id === 0) && (
          <Button
            variant="outline"
            className="bg-white hover:bg-purple-600 hover:text-white"
            onClick={() => setIsModalOpen(true)}
          >
            Continue Application
          </Button>
        )}
      </div>

      <div className="h-screen flex flex-col lg:flex-row">
        {/* Progress Timeline - Now responsive */}
        <div className="w-full lg:w-[280px] lg:flex-shrink-0 lg:h-full">
          <div className="h-auto lg:h-full bg-gradient-to-b from-purple-700 to-purple-600 p-4 lg:p-6 shadow-lg">
            <ProgressTimeline currentStep={currentStep} steps={steps} />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex-1 mx-auto bg-white p-3 rounded-xl shadow-sm w-full">
            {renderStepContent()}
          </div>

          {/* Footer - Only visible on mobile */}
          <div className="lg:hidden py-4 px-2 text-xs text-gray-500 text-center border-t border-gray-200 mt-4">
            © 2025 DataChef. All rights reserved.
          </div>
        </div>

        {/* Right Sidebar - Hide on mobile */}
        <div className="hidden lg:block w-[280px] flex-shrink-0 h-full">
          <div
            className="h-full bg-white p-0 shadow-sm overflow-hidden relative"
            style={{
              backgroundImage: `url(${applicationForm?.generalInfo?.gender === "FEMALE" ? '/illustrations/admission-female.png' : '/illustrations/admission-form.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
        </div>
      </div>

      {/* Continue Application Modal */}
      <ContinueApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
