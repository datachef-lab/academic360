import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { EmergencyContact } from "@/types/user/emergency-contact";
import { useMutation } from "@tanstack/react-query";
import {  getEmergencyContact } from "@/services/academic";
import { createEmergencyContact, updateEmergencyContact } from "@/services/student-apis";
import { Users, Mail, Phone, Briefcase, Home, Save, CheckCircle, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useFetch } from "@/hooks/useFetch";

const formElements = [
  { name: "personName", label: "Guardian's Name", type: "text", icon: <Users className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "relationToStudent", label: "Relation to Student", type: "text", icon: <Users className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "officePhone", label: "Office Phone", type: "tel", icon: <Briefcase className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "residentialPhone", label: "Residential Phone", type: "tel", icon: <Home className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const defaultEmergencyContact: EmergencyContact = {
  studentId: 0,
  personName: "",
  relationToStudent: "",
  email: "",
  phone: "",
  officePhone: "",
  residentialPhone: "",
};

// Define interface for component props
interface EmergencyContactProps {
  studentId: number;
}

const EmergencyContactForm = ({ studentId }: EmergencyContactProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: emergencyContactData, loading, refetch } = useFetch<EmergencyContact>({
    getFn: () => getEmergencyContact(studentId),
    postFn: (data) => createEmergencyContact(data),
    default: defaultEmergencyContact
  });

  const [formData, setFormData] = useState<EmergencyContact>(defaultEmergencyContact);

  useEffect(() => {
    if (emergencyContactData) {
      setFormData(emergencyContactData);
    }
  }, [emergencyContactData]);

  const updateMutation = useMutation({
    mutationFn: (formData: EmergencyContact) => 
      emergencyContactData?.id 
        ? updateEmergencyContact(formData, studentId)
        : createEmergencyContact(formData),
    onSuccess: () => {
      toast.success("Emergency contact has been successfully updated.", {
        icon: <PenLine />,
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save emergency contact. Please try again.");
      console.error("Error saving emergency contact:", error);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.personName) newErrors.personName = "Name is required";
    if (!formData.relationToStudent) newErrors.relationToStudent = "Relation is required";
    if (!formData.email || !formData.email.includes("@")) newErrors.email = "Invalid email format";
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [updateMutation.isSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading || !validateForm()) return;
    updateMutation.mutate(formData);
  };

  return (
    <div className="shadow-lg border bg-white py-10 w-full flex items-center rounded-lg  justify-center px-5">
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <div className="relative p-1">
              {errors[name] ? <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span> : null}
              <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                 value={formData[name as keyof EmergencyContact] as string || ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors[name] ? "border-red-500" : ""}`}
              />
            </div>
          </div>
        ))}
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
};

export default EmergencyContactForm;
