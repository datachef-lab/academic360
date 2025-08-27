import React, {
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  AdmissionGeneralInfo,
  ApplicationForm,
  Category,
  Nationality,
  admissionGeneralInfo,
  genderType,
} from "@/db/schema";
import { useApplicationForm } from "@/hooks/use-application-form";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ApplicationFormDto } from "@/types/admissions/index";
interface GeneralInfoStepProps {
  stepNotes: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
}

const STATES = [
  "West Bengal",
  "Maharashtra",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Delhi",
  "Bihar",
  "Rajasthan",
  "Madhya Pradesh",
  // ...add more as needed
];

const CATEGORIES = ["General", "SC", "ST", "OBC-A", "OBC-B"];

const GENDERS = genderType.enumValues;
type Gender = (typeof GENDERS)[number];

// const DEGREES = ["Under Graduate", "Post Graduate"];

// Simple static red dot for required fields
export const RedDot = () => (
  <span className="ml-1 inline-block align-middle">
    <span className="inline-block h-2 w-2 rounded-full bg-red-600"></span>
  </span>
);

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

export default function GeneralInfoStep({
  stepNotes,
  onNext,
  onPrev,
}: GeneralInfoStepProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { admission, applicationForm, setApplicationForm, login } =
    useApplicationForm();
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdmissionGeneralInfo>({
    applicationFormId: 0,
    firstName: "",
    dateOfBirth: "",
    password: "",
    mobileNumber: "",
    email: "",
    residenceOfKolkata: false,
    whatsappNumber: "",
  });

  const isGeneralInfoLocked = !!(
    applicationForm?.generalInfo &&
    applicationForm.generalInfo.id &&
    applicationForm.generalInfo.id !== 0
  );

  // Handle changes in generalInfo
  const handleGeneralInfoChange = (
    field: keyof AdmissionGeneralInfo,
    value: any
  ) => {
    if (!applicationForm) return;

    setApplicationForm({
      ...applicationForm,
      generalInfo: {
        ...applicationForm.generalInfo,
        [field]: value,
      } as AdmissionGeneralInfo,
    });
  };

  const generalInfo =
    applicationForm?.generalInfo ||
    ({
      applicationFormId: 0,
      dateOfBirth: new Date().toISOString().split("T")[0],
      email: "",
      firstName: "",
      middleName: null,
      lastName: "",
      mobileNumber: "",
      password: "",
      categoryId: null,
      degreeLevel: "UNDER_GRADUATE",
      residenceOfKolkata: true,
      gender: "FEMALE",
      isGujarati: false,
      nationalityId: null,
      otherNationality: null,
      religionId: null,
      whatsappNumber: null,
    } as AdmissionGeneralInfo);

  // Fetch nationalities on component mount
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await fetch("/api/nationalities");
        if (!response.ok) {
          throw new Error("Failed to fetch nationalities");
        }
        const result = await response.json();
        if (result.success && result.data) {
          setNationalities(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch nationalities");
        }
      } catch (error) {
        console.error("Error fetching nationalities:", error);
      }
    };

    void fetchNationalities();
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const result = await response.json();
        if (result.success && result.data) {
          setCategories(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    void fetchCategories();
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!generalInfo.firstName?.trim()) {
      errors.firstName = "First name is required";
    }
    if (!generalInfo.lastName?.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!generalInfo.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(generalInfo.email)) {
      errors.email = "Invalid email format";
    }
    if (!generalInfo.mobileNumber?.trim()) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(generalInfo.mobileNumber)) {
      errors.mobileNumber = "Mobile number must be 10 digits";
    }
    if (!generalInfo.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    }
    if (!generalInfo.categoryId) {
      errors.categoryId = "Category is required";
    }
    if (!generalInfo.gender) {
      errors.gender = "Gender is required";
    }
    if (!generalInfo.nationalityId) {
      errors.nationalityId = "Nationality is required";
    }
    // Only validate password fields if not locked
    if (!isGeneralInfoLocked) {
      if (!generalInfo.password?.trim()) {
        errors.password = "Password is required";
      } else if (generalInfo.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
      if (generalInfo.password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If info is locked, just proceed to next step without API calls
    if (isGeneralInfoLocked) {
      onNext();
      return;
    }

    // If info is locked, skip password validation
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
        // onClose: () => {},
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const isNewApplication =
        !applicationForm?.id || applicationForm?.id === 0;

      let requestBody: {
        form: ApplicationForm;
        generalInfo: AdmissionGeneralInfo;
      };
      let method: string;
      let url: string;
      // const {} = applicationForm;
      if (isNewApplication) {
        method = "POST";
        url = "/api/admissions/application-forms";
        requestBody = {
          form: {
            admissionId: admission?.id!,
            formStatus: "DRAFT",
            admissionStep: "ACADEMIC_INFORMATION",

            // remarks: "", // add if needed
          },
          generalInfo: {
            ...generalInfo,
            applicationFormId: 0,

            whatsappNumber: sameAsMobile
              ? generalInfo.mobileNumber
              : generalInfo.whatsappNumber,
          },
        };
      } else {
        method = "PUT";
        url = `/api/admissions/application-forms?id=${applicationForm.id}`;
        requestBody = {
          form: {
            id: applicationForm.id,
            admissionId: applicationForm.admissionId,
            formStatus: applicationForm.formStatus,
            admissionStep: applicationForm.admissionStep,
            remarks: applicationForm.remarks,
            // add any other direct DB columns if needed
          },
          generalInfo: {
            ...applicationForm.generalInfo,
            ...generalInfo,
            whatsappNumber: sameAsMobile
              ? generalInfo.mobileNumber
              : generalInfo.whatsappNumber,
          },
        };
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save form");
      }

      toast({
        title: "Success",
        description: "Form saved successfully",
        // onClose: () => {},
      });

      if (method === "POST" && data.applicationForm) {
        setApplicationForm(data.applicationForm);
      } else if (method === "PUT" && data) {
        setApplicationForm(data);
      }

      onNext();
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save form",
        variant: "destructive",
        // onClose: () => {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    onPrev();
  };

  // OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [mobileExists, setMobileExists] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper for DOB
  const dob = generalInfo.dateOfBirth
    ? new Date(generalInfo.dateOfBirth)
    : new Date();
  const dobDay = dob.getDate().toString();
  const dobMonth = (dob.getMonth() + 1).toString();
  const dobYear = dob.getFullYear().toString();

  // Serial number helper
  let sl = 1;

  // Handle Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!generalInfo.email) {
      alert("Please enter your email address first.");
      return;
    }
    setEmailOtpSent(true);
    try {
      const response = await fetch("/api/otp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "FOR_EMAIL",
          recipient: generalInfo.email,
          name: `${generalInfo.firstName} ${generalInfo.lastName || ""}`.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`Failed to send email OTP: ${data.message}`);
      } else {
        alert("Email OTP sent successfully! Check your inbox.");
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      alert("Error sending email OTP. Please try again.");
    }
  };

  // Handle Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "FOR_EMAIL",
          recipient: generalInfo.email,
          otp: emailOtp,
        }),
      });
      console.log("sending email otp", {
        type: "FOR_EMAIL",
        recipient: generalInfo.email,
        otp: emailOtp,
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setEmailVerified(true);
        alert("Email verified successfully!");
      } else {
        alert(`Invalid email OTP: ${data.message}`);
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      alert("Error verifying email OTP. Please try again.");
    }
  };

  // Handle Send Mobile OTP
  const handleSendMobileOtp = async () => {
    if (!generalInfo.mobileNumber) {
      alert("Please enter your mobile number first.");
      return;
    }
    setMobileOtpSent(true);
    try {
      const response = await fetch("/api/otp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "FOR_PHONE",
          recipient: generalInfo.mobileNumber,
          name: `${generalInfo.firstName} ${generalInfo.lastName || ""}`.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`Failed to send WhatsApp OTP: ${data.message}`);
      } else {
        alert("WhatsApp OTP sent successfully! Check your phone.");
      }
    } catch (error) {
      console.error("Error sending WhatsApp OTP:", error);
      alert("Error sending WhatsApp OTP. Please try again.");
    }
  };

  // Handle Verify Mobile OTP
  const handleVerifyMobileOtp = async () => {
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "FOR_PHONE",
          recipient: generalInfo.mobileNumber,
          otp: mobileOtp,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMobileVerified(true);
        alert("Mobile number verified successfully!");
      } else {
        alert(`Invalid mobile OTP: ${data.message}`);
      }
    } catch (error) {
      console.error("Error verifying mobile OTP:", error);
      alert("Error verifying mobile OTP. Please try again.");
    }
  };

  // Handle nationality change
  const handleNationalityChange = (value: string) => {
    if (value === "other") {
      handleGeneralInfoChange("nationalityId", null);
    } else {
      const selectedNationality = nationalities.find(
        (n) => n.id?.toString() === value
      );
      if (selectedNationality?.id) {
        handleGeneralInfoChange("nationalityId", selectedNationality.id);
      }
    }
  };

  // Debounced check for existing mobile number
  useEffect(() => {
    if (!generalInfo.mobileNumber || !admission?.id) {
      setMobileExists(false);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admissions/general-info?admissionId=${admission.id}&mobileNumber=${generalInfo.mobileNumber}`
        );
        if (res.ok) {
          setMobileExists(true);
        } else {
          setMobileExists(false);
        }
      } catch {
        setMobileExists(false);
      }
    }, 500);
    // Cleanup on unmount
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [generalInfo.mobileNumber, admission?.id]);

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800">Please Note</h3>
        {stepNotes}
      </div>

      <form onSubmit={handleNext} className="space-y-6">
        {/* General Info Section */}
        <Card className="p-6 space-y-6">
          {/* 1. Applicant's Name */}
          <div>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <Label className="mb-1 block text-sm sm:text-base">
                  1. Applicant's Name
                </Label>
                <div className="flex flex-col sm:flex-row w-full gap-3 mt-2">
                  <div className="w-full sm:w-1/3">
                    <Label className="mb-1 flex items-center text-sm">
                      First Name <RedDot />
                    </Label>
                    <Input
                      value={generalInfo.firstName || ""}
                      onChange={(e) =>
                        handleGeneralInfoChange("firstName", e.target.value)
                      }
                      required
                      placeholder="AS PER CLASS XII BOARD MARKSHEET"
                      className="w-full"
                      disabled={isGeneralInfoLocked}
                    />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <Label className="mb-1 flex items-center text-sm">
                      Middle Name
                    </Label>
                    <Input
                      value={generalInfo.middleName || ""}
                      onChange={(e) =>
                        handleGeneralInfoChange("middleName", e.target.value)
                      }
                      placeholder="AS PER CLASS XII BOARD MARKSHEET"
                      className="w-full"
                      disabled={isGeneralInfoLocked}
                    />
                    <p className="text-red-500 font-semibold text-xs mt-1">
                      (Do not write if not given in Class XII Board Marksheet)
                    </p>
                  </div>
                  <div className="w-full sm:w-1/3">
                    <Label className="mb-1 flex items-center text-sm">
                      Last Name <RedDot />
                    </Label>
                    <Input
                      value={generalInfo.lastName || ""}
                      onChange={(e) =>
                        handleGeneralInfoChange("lastName", e.target.value)
                      }
                      required
                      placeholder="AS PER CLASS XII BOARD MARKSHEET"
                      className="w-full"
                      disabled={isGeneralInfoLocked}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 2. Email */}
          <div>
            <Label className="flex items-center mb-1">
              2. Email <RedDot />
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={generalInfo.email || ""}
                onChange={(e) => {
                  handleGeneralInfoChange("email", e.target.value);
                  setEmailVerified(false); // Reset verification on email change
                  setEmailOtpSent(false);
                }}
                required
                placeholder="Email"
                disabled={isGeneralInfoLocked || emailVerified}
                className="w-full"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                {!emailVerified && !emailOtpSent && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleSendEmailOtp}
                    disabled={isGeneralInfoLocked}
                  >
                    Send OTP
                  </Button>
                )}
                {emailOtpSent && !emailVerified && (
                  <>
                    <Input
                      className="w-full sm:w-32"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Enter OTP"
                      size={"sm" as any}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyEmailOtp}
                      className="w-full sm:w-auto"
                      disabled={isGeneralInfoLocked}
                    >
                      Verify OTP
                    </Button>
                  </>
                )}
                {emailVerified && (
                  <span className="text-green-600 font-semibold text-sm flex items-center">
                    Verified ✅
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* 3. Date of Birth (split) */}
          <div>
            <Label className="flex items-center mb-1">
              3. Date of Birth <RedDot />
            </Label>
            <div className="flex gap-2">
              <Select
                value={dobDay}
                onValueChange={(val) => {
                  const newDate = new Date(
                    generalInfo.dateOfBirth || new Date()
                  );
                  newDate.setDate(Number(val));
                  handleGeneralInfoChange(
                    "dateOfBirth",
                    newDate.toISOString().split("T")[0]
                  );
                }}
                disabled={isGeneralInfoLocked}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={dobMonth}
                onValueChange={(val) => {
                  const newDate = new Date(
                    generalInfo.dateOfBirth || new Date()
                  );
                  newDate.setMonth(Number(val) - 1);
                  handleGeneralInfoChange(
                    "dateOfBirth",
                    newDate.toISOString().split("T")[0]
                  );
                }}
                disabled={isGeneralInfoLocked}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={month} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={dobYear}
                onValueChange={(val) => {
                  const newDate = new Date(
                    generalInfo.dateOfBirth || new Date()
                  );
                  newDate.setFullYear(Number(val));
                  handleGeneralInfoChange(
                    "dateOfBirth",
                    newDate.toISOString().split("T")[0]
                  );
                }}
                disabled={isGeneralInfoLocked}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* 4(a) and 4(b) Nationality/Other Nationality on same line */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="flex items-center mb-1">
                4(a). Nationality <RedDot />
              </Label>
              <Select
                value={generalInfo.nationalityId?.toString() || "other"}
                onValueChange={handleNationalityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map(
                    (nationality) =>
                      nationality.id && (
                        <SelectItem
                          key={nationality.id}
                          value={nationality.id.toString()}
                        >
                          {nationality.name}
                        </SelectItem>
                      )
                  )}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="flex items-center mb-1">
                4(b). Other Nationality
              </Label>
              <Input
                value={generalInfo.otherNationality || ""}
                onChange={(e) =>
                  handleGeneralInfoChange("otherNationality", e.target.value)
                }
                placeholder="Other Nationality"
                disabled={generalInfo.nationalityId !== null}
              />
            </div>
          </div>
          {/* 5. Category */}
          <div>
            <Label className="flex items-center mb-1">
              5. Select Category <RedDot />
            </Label>
            <Select
              value={generalInfo.categoryId?.toString() || ""}
              onValueChange={(val) =>
                handleGeneralInfoChange("categoryId", parseInt(val))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(
                  (cat) =>
                    cat.id && (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
          {/* 6. Is either of your parents Gujarati? */}
          <div>
            <Label className="flex items-center mb-1">
              6. Is either of your parents Gujarati? <RedDot />
            </Label>
            <Select
              value={generalInfo.isGujarati ? "Yes" : "No"}
              onValueChange={(val) =>
                handleGeneralInfoChange("isGujarati", val === "Yes")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* 7. Gender */}
          <div>
            <Label className="flex items-center mb-1">
              7. Select Your Gender <RedDot />
            </Label>
            <Select
              value={generalInfo.gender || "FEMALE"}
              onValueChange={(val: Gender) =>
                handleGeneralInfoChange("gender", val)
              }
              disabled={isGeneralInfoLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 8(a) and 8(b) Mobile/WhatsApp on same line */}
          <div className="flex flex-col gap-4">
            {/* 8(a). Mobile Number */}
            <div className="flex-1">
              <Label className="flex items-center mb-1 text-sm">
                8(a). Mobile Number{" "}
                <span className="text-blue-700 font-bold text-xs sm:text-sm">
                  (10-digit only.)
                </span>{" "}
                <RedDot />
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={generalInfo.mobileNumber || ""}
                  onChange={(e) => {
                    handleGeneralInfoChange("mobileNumber", e.target.value);
                    setMobileVerified(false); // Reset verification on mobile change
                    setMobileOtpSent(false);
                  }}
                  required
                  placeholder="All future communication from college will be on this No."
                  disabled={isGeneralInfoLocked || mobileVerified}
                  className="w-full"
                />
                {mobileExists && (
                  <span className="text-red-600 text-xs mt-1">
                    This mobile number is already registered for this admission
                    year.
                  </span>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  {!mobileVerified && !mobileOtpSent && (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={handleSendMobileOtp}
                      disabled={isGeneralInfoLocked || mobileExists}
                    >
                      Send OTP
                    </Button>
                  )}
                  {mobileOtpSent && !mobileVerified && (
                    <>
                      <Input
                        className="w-full sm:w-32"
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        placeholder="Enter OTP"
                        size={"sm" as any}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleVerifyMobileOtp}
                        className="w-full sm:w-auto"
                        disabled={isGeneralInfoLocked}
                      >
                        Verify OTP
                      </Button>
                    </>
                  )}
                  {mobileVerified && (
                    <span className="text-green-600 font-semibold text-sm flex items-center">
                      Verified ✅
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 8(b). WhatsApp Number */}
            <div className="flex-1">
              <Label className="flex items-center mb-1 text-sm">
                8(b). WhatsApp Number <RedDot />
              </Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Input
                  value={
                    sameAsMobile
                      ? generalInfo.mobileNumber || ""
                      : generalInfo.whatsappNumber || ""
                  }
                  onChange={(e) =>
                    handleGeneralInfoChange("whatsappNumber", e.target.value)
                  }
                  required
                  disabled={isGeneralInfoLocked || sameAsMobile}
                  placeholder="WhatsApp Number"
                  className="w-full"
                />
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Checkbox
                    checked={sameAsMobile}
                    onCheckedChange={(checked) => {
                      setSameAsMobile(!!checked);
                      if (checked) {
                        handleGeneralInfoChange(
                          "whatsappNumber",
                          generalInfo.mobileNumber
                        );
                      }
                    }}
                    id="sameAsMobile"
                  />
                  <Label htmlFor="sameAsMobile" className="text-xs sm:text-sm">
                    Same As Mobile Number
                  </Label>
                </div>
              </div>
            </div>
          </div>
          {/* 9. Are you a resident of Kolkata? */}
          <div>
            <Label className="flex items-center mb-1">
              9. Are you a resident of Kolkata? <RedDot />
            </Label>
            <Select
              value={generalInfo.residenceOfKolkata ? "Yes" : "No"}
              onValueChange={(val) => {
                handleGeneralInfoChange("residenceOfKolkata", val === "Yes");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        {/* Login Details Section */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Login Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The mobile number entered above in Sr. No. 8 (a) will be your login
            ID by default in order to access your profile on college website.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="flex items-center mb-1">
                10. Login Id <RedDot />
              </Label>
              <Input
                value={generalInfo.mobileNumber || ""}
                disabled
                placeholder="Login Id"
              />
            </div>
            <div>
              <Label className="flex items-center mb-1">
                11. Password <RedDot />
              </Label>
              <Input
                type="password"
                value={generalInfo.password || ""}
                onChange={(e) =>
                  handleGeneralInfoChange("password", e.target.value)
                }
                placeholder="Password (Max 10 Characters)"
                maxLength={10}
                required
                disabled={isGeneralInfoLocked}
              />
            </div>
            <div>
              <Label className="flex items-center mb-1">
                12. Confirm Password <RedDot />
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password (Max 10 Characters)"
                maxLength={10}
                required
                disabled={isGeneralInfoLocked}
              />
            </div>
          </div>
        </Card>
        {/* Application To Section */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Application To</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Since you are applying to B.Com./B.A./B.Sc./BBA course, the
            selection will remain "Undergraduate".
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center mb-1">
                13. Select Degree <RedDot />
              </Label>
              <Select
                value={generalInfo.degreeLevel || "UNDER_GRADUATE"}
                onValueChange={(val) =>
                  handleGeneralInfoChange("degreeLevel", val)
                }
                disabled
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNDER_GRADUATE">Under Graduate</SelectItem>
                  <SelectItem value="POST_GRADUATE">Post Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isLoading}
          >
            Previous
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </div>
      </form>

      {/* Display validation errors */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-800 font-semibold mb-2">
            Please fix the following errors:
          </h4>
          <ul className="list-disc list-inside text-red-700">
            {Object.entries(formErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
