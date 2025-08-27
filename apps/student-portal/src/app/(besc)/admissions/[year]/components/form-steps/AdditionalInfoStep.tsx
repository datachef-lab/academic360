import React, { useEffect, useState } from 'react';
import SingleParentModal from './SingleParentModal';
import { ReactNode } from 'react';
import { AnnualIncome, ApplicationForm, BloodGroup, Category, Religion, SportsCategory, SportsInfo, AdmissionGeneralInfo, sportsLevel as sportsLevelType, personTitleType, Department } from "@/db/schema";
import { AdmissionAdditionalInfoDto } from "@/types/admissions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApplicationForm } from '@/hooks/use-application-form';
import { Input } from "@/components/ui/input";

interface AdditionalInfoStepProps {
  stepNotes: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
  currentStep: number;
  generalInfo: {
    applicationFormId: number;
    firstName: string;
    dateOfBirth: string;
    password: string;
    whatsappNumber?: string;
  };
}

const sportsLevels = sportsLevelType.enumValues;

// Define available sports levels
const SPORTS_LEVELS = [
  { value: 'DISTRICT', label: 'District' },
  { value: 'STATE', label: 'State' },
  { value: 'NATIONAL', label: 'National' },
  { value: 'INTERNATIONAL', label: 'International' },
  { value: 'OTHERS', label: 'Others' },
];

export default function AdditionalInfoStep({
  stepNotes,
  onNext,
  onPrev,
  currentStep,
  generalInfo
}: AdditionalInfoStepProps) {
  const { applicationForm } = useApplicationForm();
  // Initialize state from applicationForm.additionalInfo or with defaults
  const [departmentArr, setDepartmentArr] = useState<Department[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<AdmissionAdditionalInfoDto>(
    applicationForm?.additionalInfo || {
      applicationFormId: applicationForm?.id || 0,
      
      annualIncomeId: 0,
      bloodGroupId: 0,
      categoryId: 0,
      religionId: 0,
      alternateMobileNumber: "",
      applyUnderNccCategory: false,
      applyUnderSportsCategory: false,
      departmentOfStaffParentId: null,
      disabilityType: null, // Assuming disabilityType is part of schema
      fatherName: "",
      fatherTitle: null,
      motherName: "",
      motherTitle: null,
      nameOfStaffParent: null,
      hasInternetAccess: true,
      hasLaptopOrDesktop: true,
      hasSmartphone: true,
      isEitherParentStaff: false,
      isPhysicallyChallenged: false,
      isSingleParent: false,
      sportsInfo: [], // Initialize with empty array
    }
  );

  const [annualIncomes, setAnnualIncomes] = useState<AnnualIncome[]>([]);
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [sportsCategories, setSportsCategories] = useState<SportsCategory[]>([]);

  // Initialize single parent modal state - should be false by default, only true when user actively changes to single parent
  const [isSingleParentModalOpen, setIsSingleParentModalOpen] = useState(false);
  const [alternateMobileError, setAlternateMobileError] = useState<string | null>(null);
  
  // Initialize single parent type based on existing data
  const [singleParentDetailsType, setSingleParentDetailsType] = useState<'father' | 'mother' | null>(() => {
    if (!applicationForm?.additionalInfo?.isSingleParent) return null;
    // If father name exists, it means father's details are being used
    if (applicationForm.additionalInfo.fatherName?.trim()) return 'father';
    // If mother name exists, it means mother's details are being used
    if (applicationForm.additionalInfo.motherName?.trim()) return 'mother';
    // Default to null if no parent details exist
    return null;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Add state for alternate mobile OTP
  const [altMobileOtpSent, setAltMobileOtpSent] = useState(false);
  const [altMobileOtp, setAltMobileOtp] = useState("");
  const [altMobileVerified, setAltMobileVerified] = useState(false);

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annualIncomesRes, bloodGroupsRes, categoriesRes, religionsRes, sportsCategoriesRes, departmentsRes] = await Promise.all([
          fetch('/api/annual-incomes'),
          fetch('/api/blood-groups'),
          fetch('/api/categories'),
          fetch('/api/religions'),
          fetch('/api/sports-categories'),
          fetch('/api/departments'),
        ]);

        if (annualIncomesRes.ok) {
          const data = await annualIncomesRes.json();
          setAnnualIncomes(Array.isArray(data) ? data : (data.data || []));
        }
        if (bloodGroupsRes.ok) {
          const data = await bloodGroupsRes.json();
          setBloodGroups(Array.isArray(data) ? data : (data.data || []));
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : (data.data || []));
        }
        if (religionsRes.ok) {
          const data = await religionsRes.json();
          setReligions(Array.isArray(data) ? data : (data.data || []));
        }
        if (sportsCategoriesRes.ok) {
          const data = await sportsCategoriesRes.json();
          setSportsCategories(Array.isArray(data) ? data : (data.data || []));
        }
        if (departmentsRes.ok) {
          const data = await departmentsRes.json();
          setDepartmentArr(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (error) {
        console.error('Error fetching additional info data:', error);
      }
    };

    void fetchData();
  }, []);

  // Handle changes in additionalInfo state
  const handleAdditionalInfoChange = (field: keyof AdmissionAdditionalInfoDto, value: any) => {
    if (field === 'alternateMobileNumber') {
      // Validate alternate mobile number
      if (value === applicationForm!.generalInfo!.mobileNumber) {
        setAlternateMobileError('Alternate Mobile Number cannot be the same as Mobile Number.');
      } else {
        setAlternateMobileError(null);
      }
    }
    // Sports Category logic
    if (field === 'applyUnderSportsCategory') {
      if (value === true && additionalInfo.sportsInfo.length === 0) {
        // Add a default sports row
        setAdditionalInfo(prev => ({
          ...prev,
          applyUnderSportsCategory: true,
          sportsInfo: [{ additionalInfoId: prev.id ?? 0, sportsCategoryId: 0, level: 'OTHERS' }]
        }));
        return;
      } else if (value === false) {
        setAdditionalInfo(prev => ({
          ...prev,
          applyUnderSportsCategory: false,
          sportsInfo: []
        }));
        return;
      }
    }
    setAdditionalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle changes in sports entries within additionalInfo.sportsInfo
  const handleSportsEntryChange = (index: number, field: keyof SportsInfo, value: any) => {
    const newSportsInfo = [...additionalInfo.sportsInfo];
    // Basic type conversion for number IDs if needed
    if (field === 'sportsCategoryId') {
        (newSportsInfo[index][field] as any) = parseInt(value);
    } else {
        (newSportsInfo[index][field] as any) = value; // Use as any for now, consider refining types
    }
    
    setAdditionalInfo(prev => ({
        ...prev,
        sportsInfo: newSportsInfo
    }));
  };

  // Add a new sports entry
  const addSportsEntry = () => {
    const newEntry: SportsInfo = { // Use schema type for new entry
      additionalInfoId: additionalInfo.id ?? 0, // Set parent ID (0 if not available yet)
      sportsCategoryId: 0, // Default or placeholder
      level: 'OTHERS',
    };
    setAdditionalInfo(prev => ({
      ...prev,
      sportsInfo: [...prev.sportsInfo, newEntry]
    }));
  };
  
  // Handle remove sports entry
  const removeSportsEntry = (index: number) => {
      setAdditionalInfo(prev => ({
          ...prev,
          sportsInfo: prev.sportsInfo.filter((_, i) => i !== index)
      }));
  };

  // Helper to find sports category name by ID
  const getSportsCategoryName = (id: number) => {
    const category = sportsCategories.find(cat => cat.id === id);
    return category ? category.name : 'Unknown Sport';
  };

  // Refactored handleSingleParentChange
  const handleSingleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "Yes";
    handleAdditionalInfoChange("isSingleParent", value);
    if (value) {
      // Only open modal if changing TO single parent
      setIsSingleParentModalOpen(true);
    } else {
      // When changing FROM single parent status
      setSingleParentDetailsType(null);
      // Clear both parent's details
      setAdditionalInfo(prev => ({
        ...prev,
        fatherName: '',
        fatherTitle: null,
        motherName: '',
        motherTitle: null,
      }));
    }
  };

  // Handle parent type selection from modal
  const handleSelectParentType = (parentType: 'father' | 'mother') => {
    setSingleParentDetailsType(parentType);
    setIsSingleParentModalOpen(false);
    // Clear the details of the other parent
    if (parentType === 'father') {
      setAdditionalInfo(prev => ({
        ...prev,
        motherName: '',
        motherTitle: null,
      }));
    } else {
      setAdditionalInfo(prev => ({
        ...prev,
        fatherName: '',
        fatherTitle: null,
      }));
    }
  };

  const handleNext = async () => {
    // Run validation and set errors
    const errors: { [key: string]: string } = {};
    
    // Parent details validation based on single parent status
    if (additionalInfo.isSingleParent) {
      // If single parent, only validate the selected parent's details
      if (singleParentDetailsType === 'father') {
        if (!additionalInfo.fatherName?.trim()) errors.fatherName = "Father's name is required";
        if (!additionalInfo.fatherTitle) errors.fatherTitle = "Father's title is required";
      } else if (singleParentDetailsType === 'mother') {
        if (!additionalInfo.motherName?.trim()) errors.motherName = "Mother's name is required";
        if (!additionalInfo.motherTitle) errors.motherTitle = "Mother's title is required";
      } else {
        // If single parent is selected but no parent type is chosen
        errors.singleParent = "Please select parent type in the single parent modal";
      }
    } else {
      // If not single parent, require both parents' details
      if (!additionalInfo.fatherName?.trim()) errors.fatherName = "Father's name is required";
      if (!additionalInfo.motherName?.trim()) errors.motherName = "Mother's name is required";
      if (!additionalInfo.fatherTitle) errors.fatherTitle = "Father's title is required";
      if (!additionalInfo.motherTitle) errors.motherTitle = "Mother's title is required";
    }
    
    // Other required fields
    if (!additionalInfo.annualIncomeId) errors.annualIncomeId = "Annual family income is required";
    if (!additionalInfo.bloodGroupId) errors.bloodGroupId = "Blood group is required";
    if (!additionalInfo.religionId) errors.religionId = "Religion is required";
    
    // Conditional validations
    if (additionalInfo.isPhysicallyChallenged && !additionalInfo.disabilityType) {
      errors.disabilityType = "Disability type is required";
    }
    if (additionalInfo.isEitherParentStaff && !additionalInfo.nameOfStaffParent) {
      errors.nameOfStaffParent = "Staff parent name is required";
    }
    if (additionalInfo.isEitherParentStaff && !additionalInfo.departmentOfStaffParentId) {
      errors.departmentOfStaffParent = "Staff parent department is required";
    }
    
    // Sports validation only if applying under sports category
    if (additionalInfo.applyUnderSportsCategory) {
      if (!additionalInfo.sportsInfo || additionalInfo.sportsInfo.length === 0) {
        errors.sportsInfo = "At least one sport is required";
      } else {
        const invalidSports = additionalInfo.sportsInfo.some(entry => !entry.sportsCategoryId || entry.sportsCategoryId === 0);
        if (invalidSports) {
          errors.sportsInfo = "Please select a valid sport for all entries";
        }
      }
    }
    
    // Alternate mobile validation only if number is provided
    if (additionalInfo.alternateMobileNumber && additionalInfo.alternateMobileNumber.trim() !== "") {
      if (!altMobileVerified) {
        errors.alternateMobileNumber = "Alternate mobile number must be verified";
      }
      if (alternateMobileError) {
        errors.alternateMobileNumber = alternateMobileError;
      }
    }

    // Set form errors
    setFormErrors(errors);

    // If there are validation errors, show toast and return
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before proceeding");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, save/update the additional info
      let additionalInfoResponse;
      const { createdAt, updatedAt, ...additionalInfoToSend } = additionalInfo;
      
      if (!additionalInfo.id) {
        // Create new additional info
        additionalInfoResponse = await fetch("/api/admissions/additional-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(additionalInfoToSend),
        });
      } else {
        // Update existing additional info
        additionalInfoResponse = await fetch("/api/admissions/additional-info", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(additionalInfoToSend),
        });
      }

      if (!additionalInfoResponse.ok) {
        const errorData = await additionalInfoResponse.json();
        throw new Error(errorData.message || "Failed to save additional info");
      }

      // Then update the application form, but only certain fields
      const formData = {
        form: {
          id: applicationForm!.id,
          admissionId: applicationForm!.admissionId,
          // Only update step if this is a new additional info entry
          ...((!additionalInfo.id) && {
            admissionStep: "PAYMENT"
          })
        }
      };

      const formResponse = await fetch(`/api/admissions/application-forms?id=${applicationForm!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!formResponse.ok) {
        const errorData = await formResponse.json();
        throw new Error(errorData.message || "Failed to update form");
      }

      toast.success("Form saved successfully");

      // Always proceed to next step after successful save
      onNext();
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onPrev();
    }
  };

  // Add handlers for sending and verifying OTP
  const handleSendAltMobileOtp = async () => {
    if (!additionalInfo.alternateMobileNumber) {
      toast.error("Please enter the alternate mobile number first.");
      return;
    }
    setAltMobileOtpSent(true);
    try {
      const response = await fetch("/api/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOR_PHONE",
          recipient: additionalInfo.alternateMobileNumber,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(`Failed to send OTP: ${data.message}`);
      } else {
        toast.success("OTP sent successfully! Check your phone.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP. Please try again.");
    }
  };

  const handleVerifyAltMobileOtp = async () => {
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOR_PHONE",
          recipient: additionalInfo.alternateMobileNumber,
          otp: altMobileOtp,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAltMobileVerified(true);
        toast.success("Alternate mobile number verified successfully!");
      } else {
        toast.error(`Invalid OTP: ${data.message}`);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Error verifying OTP. Please try again.");
    }
  };

  return (
    <div className="flex flex-row gap-8 w-full min-w-[1100px]">
      <div className="space-y-6 min-w-[900px] w-[900px]">
        <div className="space-y-4 p-2 sm:p-4">
          <h2 className="text-base sm:text-xl font-semibold mb-4">
            Step 4 of 5 - Additional Information (Sr. No 19 to 37)
          </h2>
          {stepNotes && <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-3 sm:p-4 text-left text-xs sm:text-sm">{stepNotes}</div>}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                19. Alternate Mobile Number (10-digit only) *
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={additionalInfo.alternateMobileNumber || ''}
                  onChange={(e) => {
                    handleAdditionalInfoChange("alternateMobileNumber", e.target.value);
                    setAltMobileVerified(false); // Reset verification on change
                    setAltMobileOtpSent(false);
                  }}
                  className={`w-full p-2 border ${alternateMobileError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                {!altMobileVerified && !altMobileOtpSent && (
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleSendAltMobileOtp}
                    disabled={isSubmitting || !additionalInfo.alternateMobileNumber || alternateMobileError !== null}
                  >Send OTP</Button>
                )}
                {altMobileOtpSent && !altMobileVerified && (
                  <>
                    <Input
                      className="w-32"
                      value={altMobileOtp}
                      onChange={e => setAltMobileOtp(e.target.value)}
                      placeholder="Enter OTP"
                      size={"sm" as any}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyAltMobileOtp}
                      disabled={isSubmitting}
                    >Verify OTP</Button>
                  </>
                )}
                {altMobileVerified && (
                  <span className="text-green-600 font-semibold text-xs ml-2">Verified</span>
                )}
              </div>
              {alternateMobileError && <p className="text-red-500 text-sm mt-1">{alternateMobileError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                20. Blood Group *
              </label>
              <select
                value={additionalInfo.bloodGroupId || ''}
                onChange={(e) => handleAdditionalInfoChange("bloodGroupId", parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Blood Group</option>
                 {bloodGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                21. Religion *
              </label>
              <select
                value={additionalInfo.religionId || ''}
                onChange={(e) => handleAdditionalInfoChange("religionId", parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Religion</option>
                 {religions.map(religion => (
                  <option key={religion.id} value={religion.id}>{religion.name}</option>
                ))}
              </select>
            </div>
             {/* Category field - added based on state variable */}
             <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                value={additionalInfo.categoryId || ''}
                onChange={(e) => handleAdditionalInfoChange("categoryId", parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                 {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                22. Physically Challenged *
              </label>
              <select
                value={additionalInfo.isPhysicallyChallenged ? 'Yes' : 'No'}
                onChange={(e) =>
                  handleAdditionalInfoChange("isPhysicallyChallenged", e.target.value === 'Yes')
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {additionalInfo.isPhysicallyChallenged && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  23. Type of Physically Challenged
                </label>
                <input // Assuming disabilityType is a string in schema
                  type="text"
                  value={additionalInfo.disabilityType || ''}
                  onChange={(e) =>
                    handleAdditionalInfoChange("disabilityType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                 {/* If it's a select, use select element and map options */}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                24. Single Parent *
              </label>
              <select
                value={additionalInfo.isSingleParent ? 'Yes' : 'No'}
                onChange={handleSingleParentChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                25. Select Title (Father's Name) *
              </label>
              <select
                value={additionalInfo.fatherTitle || ''}
                onChange={(e) => handleAdditionalInfoChange("fatherTitle", e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={additionalInfo.isSingleParent === true && singleParentDetailsType === 'mother'} // Disable if single parent and mother details are entered
              >
                <option value={""}>Select Title</option>
                {personTitleType.enumValues.map(ele => (
                  <option key={ele} value={ele}>{ele}</option>
                ))}
                {/* Add other relevant titles if needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                26. Father's Name *
              </label>
              <input
                type="text"
                value={additionalInfo.fatherName || ''}
                onChange={(e) => handleAdditionalInfoChange("fatherName", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AS PER CLASS XII BOARD ADMIT CARD"
                required
                disabled={additionalInfo.isSingleParent === true && singleParentDetailsType === 'mother'} // Disable if single parent and mother details are entered
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                27. Select Title (Mother's Name) *
              </label>
              <select
                value={additionalInfo.motherTitle || ''}
                onChange={(e) => handleAdditionalInfoChange("motherTitle", e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={additionalInfo.isSingleParent === true && singleParentDetailsType === 'father'} // Disable if single parent and father details are entered
              >
                <option value={""}>Select Title</option>
                {personTitleType.enumValues.map(ele => (
                  <option key={ele} value={ele}>{ele}</option>
                ))}
                {/* Add other relevant titles if needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                28. Mother's Name *
              </label>
              <input
                type="text"
                value={additionalInfo.motherName || ''}
                onChange={(e) => handleAdditionalInfoChange("motherName", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AS PER CLASS XII BOARD ADMIT CARD"
                required
                disabled={additionalInfo.isSingleParent === true && singleParentDetailsType === 'father'} // Disable if single parent and father details are entered
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                29. Is either of your Parents a staff of this College/Society/or its
                units? *
              </label>
              <select
                value={additionalInfo.isEitherParentStaff ? 'Yes' : 'No'}
                onChange={(e) => handleAdditionalInfoChange("isEitherParentStaff", e.target.value === 'Yes')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {additionalInfo.isEitherParentStaff && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">30. Name</label>
                  <input
                    type="text"
                    value={additionalInfo.nameOfStaffParent || ''}
                    onChange={(e) =>
                      handleAdditionalInfoChange("nameOfStaffParent", e.target.value || null)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">31. Department</label>
                  <select
                    value={additionalInfo.departmentOfStaffParentId || ''}
                    onChange={(e) => handleAdditionalInfoChange("departmentOfStaffParentId", e.target.value || null)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departmentArr.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                32. Do you have a Smartphone? *
              </label>
              <select
                value={additionalInfo.hasSmartphone ? 'Yes' : 'No'}
                onChange={(e) => handleAdditionalInfoChange("hasSmartphone", e.target.value === 'Yes')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                33. At your place of residence, do you have access to Laptop/Desktop? *
              </label>
              <select
                value={additionalInfo.hasLaptopOrDesktop ? 'Yes' : 'No'}
                onChange={(e) =>
                  handleAdditionalInfoChange("hasLaptopOrDesktop", e.target.value === 'Yes')
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                34. At your place of residence, do you have access to Internet? *
              </label>
              <select
                value={additionalInfo.hasInternetAccess ? 'Yes' : 'No'}
                onChange={(e) => handleAdditionalInfoChange("hasInternetAccess", e.target.value === 'Yes')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                35. Annual Family Income *
              </label>
              <select
                value={additionalInfo.annualIncomeId || ''}
                onChange={(e) =>
                  handleAdditionalInfoChange("annualIncomeId", parseInt(e.target.value) || 0)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                 {annualIncomes.map(income => (
                  <option key={income.id} value={income.id}>{income.range}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                36. Do you want to apply under NCC Category? *
              </label>
              <select
                value={additionalInfo.applyUnderNccCategory ? 'Yes' : 'No'}
                onChange={(e) => handleAdditionalInfoChange("applyUnderNccCategory", e.target.value === 'Yes')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                37. Do you want to apply under Sports Category? *
              </label>
              <select
                value={additionalInfo.applyUnderSportsCategory ? 'Yes' : 'No'}
                onChange={(e) => handleAdditionalInfoChange("applyUnderSportsCategory", e.target.value === 'Yes')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {additionalInfo.applyUnderSportsCategory && (
              <div className="md:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Sports Details</h3>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto rounded-md border">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sr. No.</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sports</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionalInfo.sportsInfo.map((entry, index) => (
                        <tr key={index}>
                          <td className="py-2 px-4 border-b">
                            {index + 1}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <select
                              value={entry.sportsCategoryId || ''}
                              onChange={(e) => handleSportsEntryChange(index, 'sportsCategoryId', e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded-md"
                            >
                              <option value="">Select Sport</option>
                              {sportsCategories.map(sport => (
                                sport.id && (
                                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                                )
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <select
                              value={entry.level || ''}
                              onChange={(e) => handleSportsEntryChange(index, 'level', e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded-md"
                            >
                              <option value="">Select Level</option>
                              {sportsLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <button
                              type="button"
                              onClick={() => removeSportsEntry(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {additionalInfo.sportsInfo.map((entry, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Sr. No. {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeSportsEntry(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Sports</label>
                          <select
                            value={entry.sportsCategoryId || ''}
                            onChange={(e) => handleSportsEntryChange(index, 'sportsCategoryId', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select Sport</option>
                            {sportsCategories.map(sport => (
                              sport.id && (
                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                              )
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                          <select
                            value={entry.level || ''}
                            onChange={(e) => handleSportsEntryChange(index, 'level', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select Level</option>
                            {SPORTS_LEVELS.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSportsEntry}
                  className="mt-3 w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                >
                  Add Row
                </button>
              </div>
            )}
          </div>
        </div>
        <SingleParentModal
          isOpen={isSingleParentModalOpen}
          onClose={() => setIsSingleParentModalOpen(false)}
          onSelectParentType={handleSelectParentType}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save & Next"}
          </Button>
        </div>

        {/* Display validation errors */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside text-red-700">
              {Object.entries(formErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
     
    </div>
  );
}
