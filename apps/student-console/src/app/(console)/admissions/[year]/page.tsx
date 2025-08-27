"use client";
// import { useEffect, useState } from "react";
// import { FormData, Step } from "./types";
// import {
//   ProgressTimeline,
//   NavigationButtons,
//   GeneralInfoStep,
//   AcademicInfoStep,
//   CourseApplicationStep,
//   AdditionalInfoStep,
//   PaymentStep,
// } from "./components";
// import Image from "next/image";
// import { Admission, AdmissionGeneralInfo, ApplicationForm } from "@/db/schema";
// import { useParams, useRouter } from "next/navigation";

// // Notes for each step
// const stepNotes: Record<number, React.ReactNode> = {
//   1: (
//     <div>
//       <div><b>Please Note :</b></div>
//       <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
//         <li>All the fields in the above Form are mandatory.</li>
//         <li>Please cross check all the fields especially <b>Category, Gender & Mobile Number</b> before submitting the Form, as these fields are not editable afterwards.</li>
//         <li>As per UGC directives in alignment with NEP 2020, all applicants seeking admission are required to create an Academic Bank of Credits (ABC) account. You will be required to submit this ABC ID at the time of registration to University of Calcutta. <a href="https://www.abc.gov.in/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Click here to create your ABC ID.</a></li>
//         <li>For Indian citizens applying for admission, it is mandatory to possess an Aadhar Card. Kindly ensure that you have your Aadhar and related ready to prevent any delays in the admission process.</li>
//         <li><span className="text-red-600 font-bold">Red dot</span> indicates mandatory field.</li>
//       </ol>
//     </div>
//   ),
//   2: (
//     <div>
//       <b>Please Note :</b>
//       <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
//         <li>
//           Candidates with "Pass Certificate Awarded" as their Class XII Board
//           result are only eligible to apply.
//         </li>
//         <li>
//           Fail / Compartmental students are not allowed to apply as per Calcutta
//           University Norms.
//         </li>
//         <li>
//           Fill-up your marks as per your class XII Board marksheet in the marks
//           Entry option.
//         </li>
//         <li>
//           In case your Board has not issued the Original Marksheet yet, you can
//           proceed with your application by entering the marks as given in your
//           Digital Marksheet.
//         </li>
//         <li>
//           It is mandatory for students to provide the Original copy of the Class
//           XII Board Marksheet at the time of document verification or when asked
//           by the College, if selected.
//         </li>
//         <li>
//           Applicants whose board is not listed in the drop-down, need to get an
//           Equivalency Certificate from Equivalency Department of Calcutta
//           University, College street campus.
//         </li>
//         <li>
//           Once Board / Marks & Institute details are filled up, please click on
//           Submit button to save and continue for course selection.
//         </li>
//         <li>
//           <span className="text-red-600 font-bold">Red dot</span> indicates
//           mandatory field.
//         </li>
//       </ol>
//     </div>
//   ),
//   3: (
//     <div>
//       <b>Course Application Note:</b> Select your desired program and specialization carefully. Once submitted, changes may not be allowed.
//     </div>
//   ),
//   4: (
//     <div>
//       <b>Please Note :</b>
//       <ol className="list-decimal ml-5 mt-1 space-y-1 text-sm">
//         <li>
//           Sr. No. 19 cannot be same as Mobile Number and Whatsapp Number given in
//           Step 1.
//         </li>
//         <li>
//           In case of Physically challanged being 'Yes', relevant documents will
//           be required at the time of admission, if Selected.
//         </li>
//         <li>
//           <span className="text-red-600 font-bold">Red dot</span> indicates
//           mandatory field.
//         </li>
//       </ol>
//     </div>
//   ),
//   5: (
//     <div>
//       <b>Payment Note:</b> Review your payment details before proceeding. Application fees are non-refundable.
//     </div>
//   ),
// };

// export default function StudentSignupForm() {
//   const { year } = useParams<{year: string}>();
//   const router = useRouter();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [admission, setAdmisson] = useState<Admission | null>(null);
//   const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
//     admissionId: 0,
//     admissionStep: "GENERAL_INFORMATION",
//     formStatus: "DRAFT",
//   });
//   const [generalInfo, setGeneralInfo] = useState<AdmissionGeneralInfo>({
//     applicationFormId: applicationForm?.id ?? 0,
//     dateOfBirth: new Date().toISOString().split('T')[0],
//     email: "",
//     firstName: "",
//     middleName: null,
//     lastName: "",
//     mobileNumber: "",
//     password: "",
//     categoryId: null,
//     degreeLevel: "UNDER_GRADUATE",
//     residenceOfKolkata: true,
//     gender: "FEMALE",
//     isGujarati: false,
//     nationalityId: null,
//     otherNationality: null,
//     religionId: null,
//     whatsappNumber: null,
//   });

//   const steps: Step[] = [
//     { number: 1, title: "General Information" },
//     { number: 2, title: "Academic Information" },
//     { number: 3, title: "Course Application" },
//     { number: 4, title: "Additional Information" },
//     { number: 5, title: "Payment" },
//   ];

//   useEffect(() => {
//     if (isNaN(Number(year))) {
//       router.push("/");
//       return;
//     }

//     fetchAdmission()
//       .then(async (adm) => {
//         setAdmisson(adm as Admission);
//         if (adm) {
//           await fetchApplicantionForm(adm.id!)
//         }
//       })
//       .catch(err => alert(err));

//   }, [year, router]);

//   const fetchAdmission = async (): Promise<Admission  | null> => {
//     try {

//     } catch (error) {

//     }

//     return null; // TODO
//   }
//   const fetchApplicantionForm =  async (admissionId: number): Promise<ApplicationForm  | null> => {
//     try {

//     } catch (error) {

//     }

//     return null; // TODO
//   }

//   const handleInputChange = (field: keyof ApplicationForm, value: any) => {
//     setApplicationForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleNext = () => {
//     if (currentStep < steps.length) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentStep > 1) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const handleSubmit = () => {
//     console.log("Form submitted:", applicationForm);
//     alert("Application submitted successfully!");
//   };

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <GeneralInfoStep
//           setGeneralInfo={setGeneralInfo}
//             applicationForm={applicationForm}
//             stepNotes={stepNotes[currentStep]}
//             generalInfo={generalInfo}
//           />
//         );
//       case 2:
//         return (
//           <AcademicInfoStep
//             applicationForm={applicationForm}
//             stepNotes={stepNotes[currentStep]}
//           />
//         );
//       case 3:
//         return (
//           <CourseApplicationStep
//             applicationForm={applicationForm}
//             stepNotes={stepNotes[currentStep]}
//           />
//         );
//       case 4:
//         return (
//           <AdditionalInfoStep
//             generalInfo={generalInfo}
//             applicationForm={applicationForm}
//             stepNotes={stepNotes[currentStep]}
//           />
//         );
//       case 5:
//         return (
//           <PaymentStep
//           onPaymentInfoChange={(field: keyof ApplicationForm, value: any) => {}}
//             applicationForm={applicationForm}
//             stepNotes={stepNotes[currentStep]}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 overflow-x-hidden">
//       <div className="h-screen flex flex-col lg:flex-row">
//         {/* Progress Timeline - Now responsive */}
//         <div className="w-full lg:w-[280px] lg:flex-shrink-0 lg:h-full">
//           <div className="h-auto lg:h-full bg-gradient-to-b from-purple-700 to-purple-600 p-4 lg:p-6 shadow-lg">
//             <ProgressTimeline currentStep={currentStep} steps={steps} />
//           </div>
//         </div>

//         {/* Form Content */}
//         <div className="flex-1 flex flex-col p-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
//           <div className="flex-1 mx-auto bg-white p-3 rounded-xl shadow-sm w-full">
//             {renderStepContent()}

//             <NavigationButtons
//               currentStep={currentStep}
//               totalSteps={steps.length}
//               onPrevious={handlePrevious}
//               onNext={handleNext}
//               onSubmit={handleSubmit}
//             />
//           </div>

//           {/* Footer - Only visible on mobile */}
//           <div className="lg:hidden py-4 px-2 text-xs text-gray-500 text-center border-t border-gray-200 mt-4">
//             © 2025 DataChef. All rights reserved.
//           </div>
//         </div>

//         {/* Right Sidebar - Hide on mobile */}
//         <div className="hidden lg:block w-[280px] flex-shrink-0 h-full">
//           <div
//             className="h-full bg-white p-0 shadow-sm overflow-hidden relative"
//             style={{
//               backgroundImage: "url('/illustrations/admission-form.png')",
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//               backgroundRepeat: 'no-repeat',
//             }}
//           ></div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import AdmissionForm from "@/components/admissions/AdmissionForm";
import { Admission } from "@/db/schema";
import { ApplicationFormProvider } from "@/providers/adm-application-form-provider";

export default function AdmissionFormPage() {
  const { year } = useParams<{ year: string }>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [admission, setAdmisson] = useState<Admission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admissions/${year}`, {
        method: "GET",
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(
          errorData.message ||
          "Unable to load the admission year. Please try again later."
        );
        setAdmisson(null);
        return;
      }
      const data = (await response.json()) as {admission: Admission};
      console.log("adm data (raw):", data);
      setAdmisson({ ...data.admission });
    } catch (err) {
      console.error("Error fetching admission details:", err);
      setError(
        "Something went wrong while loading the admission year. Please check your network connection."
      );
      setAdmisson(null);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAdmission();
  }, [year, fetchAdmission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Admission Found</h2>
          <p className="text-gray-600">No admission details found for the selected year.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {(admission.isClosed !== undefined && !admission.isClosed) ? (
        <ApplicationFormProvider admission={admission}>
          <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <AdmissionForm />
          </div>
        </ApplicationFormProvider>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Admission Closed
            </h2>
            <p className="text-gray-600">
              The admission process for this year is currently closed.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
