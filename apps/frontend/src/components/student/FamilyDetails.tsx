/* eslint-disable @typescript-eslint/no-explicit-any */
import { IdCard, Mail, Phone, User, Briefcase, GraduationCap, BadgeIndianRupee, Save, CheckCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { findFamilyDetailsByStudentId, createFamilyDetails, updateFamilyDetails } from "@/services/Family-details-api";
import { Parent } from "@/types/user/parent";
import { ParentType } from "@/types/enums/index";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";

// Helper function to safely access object properties
const getPersonProperty = (obj: any, property: string): string => {
  if (obj && typeof obj === 'object' && property in obj && typeof obj[property] === 'string') {
    return obj[property];
  }
  return '';
};

// Helper function to safely access nested object properties
const getNestedProperty = (obj: any, nestedKey: string, property: string): string => {
  if (obj && typeof obj === 'object' && nestedKey in obj && obj[nestedKey] && 
      typeof obj[nestedKey] === 'object' && property in obj[nestedKey] && 
      typeof obj[nestedKey][property] === 'string') {
    return obj[nestedKey][property];
  }
  return '';
};

const defaultFamilyDetails: Parent = {
  studentId: 0,
  parentType: "BOTH",
  fatherDetails: {
    name: null,
    email: null,
    phone: null,
    aadhaarCardNumber: null,
    image: null,
    officePhone: null,
    qualification: null,
    occupation: null,
    officeAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  motherDetails: {
    name: null,
    email: null,
    phone: null,
    aadhaarCardNumber: null,
    image: null,
    officePhone: null,
    qualification: null,
    occupation: null,
    officeAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  guardianDetails: {
    name: null,
    email: null,
    phone: null,
    aadhaarCardNumber: null,
    image: null,
    officePhone: null,
    qualification: null,
    occupation: null,
    officeAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  annualIncome: {
    range: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const parentTypes = [
  { value: "BOTH", label: "Both Parents" },
  { value: "FATHER_ONLY", label: "Father Only" },
  { value: "MOTHER_ONLY", label: "Mother Only" },
];

// Form elements configuration for reuse
const fatherFormElements = [
  { name: "name", label: "Father's Name", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" />, field: "fatherDetails" },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />, field: "fatherDetails" },
  { name: "phone", label: "Phone", type: "text", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />, field: "fatherDetails" },
  { name: "officePhone", label: "Office Phone", type: "text", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />, field: "fatherDetails" },
  { name: "aadhaarCardNumber", label: "Aadhaar Number", type: "text", icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />, field: "fatherDetails" },
];

const motherFormElements = [
  { name: "name", label: "Mother's Name", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" />, field: "motherDetails" },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />, field: "motherDetails" },
  { name: "phone", label: "Phone", type: "text", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />, field: "motherDetails" },
  { name: "officePhone", label: "Office Phone", type: "text", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />, field: "motherDetails" },
  { name: "aadhaarCardNumber", label: "Aadhaar Number", type: "text", icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />, field: "motherDetails" },
];

const guardianFormElements = [
  { name: "name", label: "Guardian's Name", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" />, field: "guardianDetails" },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />, field: "guardianDetails" },
  { name: "phone", label: "Phone", type: "text", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />, field: "guardianDetails" },
  { name: "aadhaarCardNumber", label: "Aadhaar Number", type: "text", icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />, field: "guardianDetails" },
];

interface FamilyDetailsProps {
  studentId: number;
}

export default function FamilyDetails({ studentId }: FamilyDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<Parent>({
    ...defaultFamilyDetails,
    studentId
  });

  // Use React Query to fetch family details
  const { data: familyDetails, isLoading, isError, refetch } = useQuery({
    queryKey: ['familyDetails', studentId],
    queryFn: async () => {
      const response = await findFamilyDetailsByStudentId(studentId);
      return response.payload;
    },
    enabled: studentId > 0,
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Update form data when family details are loaded
  useEffect(() => {
    if (familyDetails) {
      console.log("Family details data loaded:", familyDetails);
      setFormData(familyDetails);
    }
  }, [familyDetails]);

  const updateMutation = useMutation({
    mutationFn: (data: Parent) => 
      data.id ? updateFamilyDetails(data.id, data) : createFamilyDetails(data),
    onSuccess: () => {
      toast.success("Family details have been successfully updated.");
      setShowSuccess(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save family details. Please try again.");
      console.error("Error saving family details:", error);
    }
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validation based on parent type
    if (formData.parentType === "BOTH" || formData.parentType === "FATHER_ONLY") {
      // Father's details validation
      if (formData.fatherDetails?.name === "" || !formData.fatherDetails?.name) {
        newErrors['fatherDetails_name'] = "Father's name is required";
      }
      if (formData.fatherDetails?.phone === "" || !formData.fatherDetails?.phone) {
        newErrors['fatherDetails_phone'] = "Phone number is required";
      }
      if (formData.fatherDetails?.email && !formData.fatherDetails.email.includes("@")) {
        newErrors['fatherDetails_email'] = "Invalid email format";
      }
    }
    
    // Mother's details validation
    if (formData.parentType === "BOTH" || formData.parentType === "MOTHER_ONLY") {
      if (formData.motherDetails?.name === "" || !formData.motherDetails?.name) {
        newErrors['motherDetails_name'] = "Mother's name is required";
      }
      if (formData.motherDetails?.phone === "" || !formData.motherDetails?.phone) {
        newErrors['motherDetails_phone'] = "Phone number is required";
      }
      if (formData.motherDetails?.email && !formData.motherDetails.email.includes("@")) {
        newErrors['motherDetails_email'] = "Invalid email format";
      }
    }

    // Guardian details validation (always required)
    if (formData.guardianDetails?.name === "" || !formData.guardianDetails?.name) {
      newErrors['guardianDetails_name'] = "Guardian's name is required";
    }
    if (formData.guardianDetails?.phone === "" || !formData.guardianDetails?.phone) {
      newErrors['guardianDetails_phone'] = "Phone number is required";
    }
    if (formData.guardianDetails?.email && !formData.guardianDetails.email.includes("@")) {
      newErrors['guardianDetails_email'] = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNestedObjectChange = (parentField: string, field: string, value: string) => {
    setFormData(prev => {
      return {
        ...prev,
        [parentField]: {
          ...(prev[parentField as keyof Parent] as object),
          [field]: value
        }
      } as Parent;
    });

    // Clear errors when field changes
    const errorKey = `${parentField}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleNestedNestedChange = (parentField: string, nestedField: string, value: string) => {
    setFormData(prev => {
      const parentObject = prev[parentField as keyof Parent];
      if (!parentObject) return prev;

      return {
        ...prev,
        [parentField]: {
          ...(parentObject as object),
          [nestedField]: { 
            ...((parentObject as any)[nestedField] || {}),
            name: value,
            id: ((parentObject as any)[nestedField]?.id || 0)
          }
        }
      } as Parent;
    });
  };

  // Add a new function for image handling before the handleSubmit function
  const handleImageUpload = (file: File, parentField: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // When read operation is finished
      const base64String = reader.result as string;
      
      setFormData(prev => {
        return {
          ...prev,
          [parentField]: {
            ...(prev[parentField as keyof Parent] as object),
            image: base64String
          }
        } as Parent;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;
    console.log("Submitting family form data:", formData);
    updateMutation.mutate(formData);
  };

  const handleParentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParentType = e.target.value as ParentType;
    setFormData((prev) => ({
      ...prev,
      parentType: newParentType
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="w-8 h-8 text-blue-500" />
        <span className="ml-2">Loading family details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-red-500">
        <p>Error loading family details</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Helper to determine if a specific parent section should be shown
  const shouldShowParentSection = (parentType: string): boolean => {
    switch (formData.parentType) {
      case "FATHER_ONLY":
        return parentType === "fatherDetails" || parentType === "guardianDetails";
      case "MOTHER_ONLY":
        return parentType === "motherDetails" || parentType === "guardianDetails";
      case "BOTH":
      default:
        return true;
    }
  };

  const renderFormElement = (element: any, parentField: string) => {
    // Skip rendering if this parent type shouldn't be shown
    if (!shouldShowParentSection(parentField)) return null;

    const { name, label, type, icon } = element;
    const fullFieldName = `${parentField}.${name}`;
    const value = getPersonProperty(formData[parentField as keyof Parent], name) || '';
    const hasError = errors[`${parentField}_${name}`];

    return (
      <div key={fullFieldName} className="flex flex-col mr-8">
        <div className="relative p-1">
          {hasError ? <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span> : null}
          <label htmlFor={fullFieldName} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
          <Input
            id={fullFieldName}
            name={fullFieldName}
            type={type}
            value={value}
            placeholder={label}
            onChange={(e) => handleNestedObjectChange(parentField, name, e.target.value)}
            className={`w-full pl-10 pr-3 rounded-lg py-2 ${hasError ? "border-red-500" : ""}`}
          />
        </div>
        {hasError && <p className="text-red-500 text-sm mt-1">{hasError}</p>}
      </div>
    );
  };

  return (
    <div className="shadow-lg border py-10 w-full bg-white flex items-center rounded-lg justify-center px-5">
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
        {/* Parent Type Selection */}
        <div className="col-span-2 mb-4">
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Parent Type</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <User className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <select
                name="parentType"
                value={formData.parentType || "BOTH"}
                onChange={handleParentTypeChange}
                className="w-full pl-10 pr-3 rounded-lg py-2 border"
              >
                {parentTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Father Details */}
        {shouldShowParentSection("fatherDetails") && (
          <>
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-2">Father's Details</h3>
            </div>
            {fatherFormElements.map(element => renderFormElement(element, "fatherDetails"))}
            
            {/* Father's Qualification */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Qualification</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <GraduationCap className="text-gray-500 dark:text-white w-5 h-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Enter Qualification"
                  value={getNestedProperty(formData.fatherDetails, 'qualification', 'name') || ''}
                  onChange={(e) => handleNestedNestedChange('fatherDetails', 'qualification', e.target.value)}
                  className="w-full pl-10 pr-3 rounded-lg py-2"
                />
              </div>
            </div>

            {/* Father's Occupation */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Occupation</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Briefcase className="text-gray-500 dark:text-white w-5 h-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Enter Occupation"
                  value={getNestedProperty(formData.fatherDetails, 'occupation', 'name') || ''}
                  onChange={(e) => handleNestedNestedChange('fatherDetails', 'occupation', e.target.value)}
                  className="w-full pl-10 pr-3 rounded-lg py-2"
                />
              </div>
            </div>

            {/* Father's Image Upload */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Upload Image</label>
              </div>
              <div className="relative">
                {formData.fatherDetails?.image && (
                  <div className="mb-2">
                    <img 
                      src={formData.fatherDetails.image as string} 
                      alt="Father's photo" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      handleImageUpload(file, "fatherDetails");
                    }
                  }}
                  className="w-full py-2"
                />
              </div>
            </div>
          </>
        )}

        {/* Mother Details */}
        {shouldShowParentSection("motherDetails") && (
          <>
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-medium mb-2">Mother's Details</h3>
            </div>
            {motherFormElements.map(element => renderFormElement(element, "motherDetails"))}
            
            {/* Mother's Qualification */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Qualification</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <GraduationCap className="text-gray-500 dark:text-white w-5 h-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Enter Qualification"
                  value={getNestedProperty(formData.motherDetails, 'qualification', 'name') || ''}
                  onChange={(e) => handleNestedNestedChange('motherDetails', 'qualification', e.target.value)}
                  className="w-full pl-10 pr-3 rounded-lg py-2"
                />
              </div>
            </div>

            {/* Mother's Occupation */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Occupation</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Briefcase className="text-gray-500 dark:text-white w-5 h-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Enter Occupation"
                  value={getNestedProperty(formData.motherDetails, 'occupation', 'name') || ''}
                  onChange={(e) => handleNestedNestedChange('motherDetails', 'occupation', e.target.value)}
                  className="w-full pl-10 pr-3 rounded-lg py-2"
                />
              </div>
            </div>

            {/* Mother's Image Upload */}
            <div className="flex flex-col mr-8">
              <div className="relative p-1">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Upload Image</label>
              </div>
              <div className="relative">
                {formData.motherDetails?.image && (
                  <div className="mb-2">
                    <img 
                      src={formData.motherDetails.image as string} 
                      alt="Mother's photo" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      handleImageUpload(file, "motherDetails");
                    }
                  }}
                  className="w-full py-2"
                />
              </div>
            </div>
          </>
        )}

        {/* Guardian Details */}
        <div className="col-span-2 mt-4">
          <h3 className="text-lg font-medium mb-2">Guardian's Details</h3>
        </div>
        {guardianFormElements.map(element => renderFormElement(element, "guardianDetails"))}
        
        {/* Guardian's Qualification */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Qualification</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <GraduationCap className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              type="text"
              placeholder="Enter Qualification"
              value={getNestedProperty(formData.guardianDetails, 'qualification', 'name') || ''}
              onChange={(e) => handleNestedNestedChange('guardianDetails', 'qualification', e.target.value)}
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>

        {/* Guardian's Occupation */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Occupation</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Briefcase className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              type="text"
              placeholder="Enter Occupation"
              value={getNestedProperty(formData.guardianDetails, 'occupation', 'name') || ''}
              onChange={(e) => handleNestedNestedChange('guardianDetails', 'occupation', e.target.value)}
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>

        {/* Guardian's Image Upload */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Upload Image</label>
          </div>
          <div className="relative">
            {formData.guardianDetails?.image && (
              <div className="mb-2">
                <img 
                  src={formData.guardianDetails.image as string} 
                  alt="Guardian's photo" 
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  handleImageUpload(file, "guardianDetails");
                }
              }}
              className="w-full py-2"
            />
          </div>
        </div>

        {/* Annual Income */}
        <div className="col-span-2 mt-4">
          <h3 className="text-lg font-medium mb-2">Annual Income</h3>
        </div>
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Income Range</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <BadgeIndianRupee className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              type="text"
              placeholder="Enter Income Range"
              value={formData.annualIncome?.range || ''}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  annualIncome: {
                    ...prev.annualIncome!,
                    range: e.target.value,
                    id: prev.annualIncome?.id || 0
                  }
                }) as Parent);
              }}
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-span-2 mt-4">
          <Button 
            type="submit" 
            onClick={(e) => handleSubmit(e)}
            className="w-full sm:w-auto text-white font-medium sm:font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
            disabled={updateMutation.isLoading}
          >
            {updateMutation.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
