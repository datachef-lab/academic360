import { Diameter, Eye, Syringe, Scale, Save, CheckCircle, PenLine } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Health } from "@/types/user/health";
import { toast } from "sonner";
import { 
  findHealthDetailsByStudentId, 
  createHealthDetails, 
  updateHealthDetails,
  updateBloodGroup 
} from "@/services/health-details-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Spinner } from "../ui/spinner";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const defaultHealthDetails: Health = {
  studentId: 0,
  eyePowerLeft: null,
  eyePowerRight: null,
  height: null,
  width: null,
  pastMedicalHistory: null,
  pastSurgicalHistory: null,
  drugAllergy: null,
  bloodGroup: null
};

// Define interface for component props
interface HealthDetailsProps {
  studentId: number;
}

export default function HealthDetails({ studentId }: HealthDetailsProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("");
  const [formData, setFormData] = useState<Health>(defaultHealthDetails);

  // Use React Query to fetch health details
  const { data: healthData, isLoading, isError, refetch } = useQuery({
    queryKey: ['healthDetails', studentId],
    queryFn: async () => {
      const result = await findHealthDetailsByStudentId(studentId);
      console.log("Health details fetched:", result);
      
      // Check if payload exists and is not null
      if (!result || result.payload === undefined) {
        return null;
      }
      
      return result.payload;
    },
    enabled: studentId > 0,
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Initialize form data when health data is loaded
  useEffect(() => {
    if (healthData) {
      console.log("Health data updated:", healthData);
      setFormData(healthData);
      
      // Update the selected blood group when data is loaded
      if (healthData.bloodGroup?.type) {
        console.log("Setting blood group from healthData:", healthData.bloodGroup.type);
        setSelectedBloodGroup(healthData.bloodGroup.type);
      }
    } else {
      setFormData({...defaultHealthDetails, studentId});
    }
  }, [healthData, studentId]);

  const updateMutation = useMutation({
    mutationFn: async (data: Health) => {
      try {
        // First try to update the health details (without blood group data)
        const { ...healthDataWithoutBloodGroup } = data;
        
        console.log("Submitting health data without blood group:", healthDataWithoutBloodGroup);
        
        // Check if we need to update or create
        let healthResult;
        if (data.id) {
          // Update existing record
          healthResult = await updateHealthDetails(data.id, healthDataWithoutBloodGroup);
        } else {
          // Before creating, check if a record for this student already exists
          try {
            const existingRecord = await findHealthDetailsByStudentId(studentId);
            if (existingRecord?.payload?.id) {
              // If exists, update instead of create
              console.log("Found existing health record, updating instead:", existingRecord.payload.id);
              healthResult = await updateHealthDetails(existingRecord.payload.id, {
                ...healthDataWithoutBloodGroup,
                id: existingRecord.payload.id
              });
            } else {
              // Create new if no existing record
              healthResult = await createHealthDetails(healthDataWithoutBloodGroup);
            }
          } catch (error) {
            console.error("Error checking for existing record:", error);
            // Fall back to create
            healthResult = await createHealthDetails(healthDataWithoutBloodGroup);
          }
        }
        
        // If blood group is selected and there's health data with ID
        if (selectedBloodGroup && healthResult?.payload?.id) {
          // Get the blood group ID from the health result if available
          const bgId = healthResult.payload.bloodGroup?.id || data.bloodGroup?.id || 0;
          
          if (bgId > 0) {
            console.log("Updating existing blood group:", { id: bgId, type: selectedBloodGroup });
            await updateBloodGroup({ id: bgId, type: selectedBloodGroup });
          } else {
            console.log("No valid blood group ID to update");
            // TODO: Handle creating a new blood group if needed
          }
        }
        
        return healthResult;
      } catch (error) {
        console.error("Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Health details have been successfully updated.", {
        icon: <PenLine />,
      });
      setShowSuccess(true);
      
      // Important: Refetch data to get the updated blood group
      setTimeout(() => {
        refetch().catch(err => {
          console.error("Error refetching after update:", err);
        });
      }, 500);
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error("Failed to save health details. Please try again.");
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
    
    // Add validation rules as needed
    if (formData.height && isNaN(Number(formData.height))) {
      newErrors.height = "Height must be a number";
    }
    
    if (formData.width && isNaN(Number(formData.width))) {
      newErrors.width = "Width must be a number";
    }
    
    if (formData.eyePowerLeft && isNaN(Number(formData.eyePowerLeft))) {
      newErrors.eyePowerLeft = "Eye power must be a number";
    }
    
    if (formData.eyePowerRight && isNaN(Number(formData.eyePowerRight))) {
      newErrors.eyePowerRight = "Eye power must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when field changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    console.log("Blood group selected by user:", value);
    setSelectedBloodGroup(value);
    
    // Update the form data with the selected blood group
    setFormData(prev => ({
      ...prev,
      bloodGroup: {
        id: prev.bloodGroup?.id || 0,
        type: value,
        createdAt: prev.bloodGroup?.createdAt || new Date(),
        updatedAt: prev.bloodGroup?.updatedAt || new Date()
      }
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Keep values as strings to match API response format
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? null : value
    }));

    // Clear errors when field changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;
    console.log("Submitting form data:", formData, "Selected blood group:", selectedBloodGroup);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="w-8 h-8 text-blue-500" />
        <span className="ml-2">Loading health details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-red-500">
        <p>Error loading health details</p>
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

  return (
    <div className="shadow-lg border bg-white py-10 w-full flex items-center rounded-lg justify-center px-5">
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
        {/* Blood Group */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Blood Group</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Syringe className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Select 
              value={selectedBloodGroup}
              onValueChange={handleSelectChange}
              defaultValue={selectedBloodGroup}
            >
              <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                <SelectValue placeholder="Select blood group">
                  {selectedBloodGroup || "Select blood group"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 mt-1">
              {formData.bloodGroup?.id ? `Blood Group ID: ${formData.bloodGroup.id}` : 'No blood group assigned'}
            </div>
          </div>
        </div>
        
        {/* Eye Power Left */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            {errors.eyePowerLeft && <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>}
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Eye Power Left</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Eye className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="eyePowerLeft"
              type="text"
              value={formData.eyePowerLeft ?? ""}
              onChange={handleNumberChange}
              placeholder="Enter eye power left"
              className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors.eyePowerLeft ? "border-red-500" : ""}`}
            />
            {errors.eyePowerLeft && <p className="text-red-500 text-sm mt-1">{errors.eyePowerLeft}</p>}
          </div>
        </div>
          
        {/* Eye Power Right */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            {errors.eyePowerRight && <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>}
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Eye Power Right</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Eye className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="eyePowerRight"
              type="text"
              value={formData.eyePowerRight ?? ""}
              onChange={handleNumberChange}
              placeholder="Enter eye power right"
              className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors.eyePowerRight ? "border-red-500" : ""}`}
            />
            {errors.eyePowerRight && <p className="text-red-500 text-sm mt-1">{errors.eyePowerRight}</p>}
          </div>
        </div>
          
        {/* Height */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            {errors.height && <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>}
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Height (cm)</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Diameter className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="height"
              type="text"
              value={formData.height ?? ""}
              onChange={handleNumberChange}
              placeholder="Enter height in cm"
              className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors.height ? "border-red-500" : ""}`}
            />
            {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
          </div>
        </div>
          
        {/* Weight */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            {errors.width && <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>}
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Weight (kg)</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Scale className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="width"
              type="text"
              value={formData.width ?? ""}
              onChange={handleNumberChange}
              placeholder="Enter weight in kg"
              className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors.width ? "border-red-500" : ""}`}
            />
            {errors.width && <p className="text-red-500 text-sm mt-1">{errors.width}</p>}
          </div>
        </div>
        
        {/* Medical History */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Past Medical History</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Syringe className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="pastMedicalHistory"
              value={formData.pastMedicalHistory || ""}
              onChange={handleChange}
              placeholder="Enter past medical history"
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>
        
        {/* Surgical History */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Past Surgical History</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Syringe className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="pastSurgicalHistory"
              value={formData.pastSurgicalHistory || ""}
              onChange={handleChange}
              placeholder="Enter past surgical history"
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>
        
        {/* Drug Allergy */}
        <div className="flex flex-col mr-8">
          <div className="relative p-1">
            <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Drug Allergy</label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Syringe className="text-gray-500 dark:text-white w-5 h-5" />
            </span>
            <Input
              name="drugAllergy"
              value={formData.drugAllergy || ""}
              onChange={handleChange}
              placeholder="Enter drug allergies"
              className="w-full pl-10 pr-3 rounded-lg py-2"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="col-span-1 sm:col-span-2 mt-2">
          <Button 
            type="submit" 
            onClick={handleSubmit} 
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
