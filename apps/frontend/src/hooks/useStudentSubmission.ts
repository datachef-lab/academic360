import { useState } from 'react';

import { 
  createAcademicHistory,
  createAcademicIdentifier,
  createEmergencyContact,
  createAccommodation,
  createFamilyDetails,
  createHealthDetails,
  createPersonalDetails,
  createAddressDetails
} from '@/services/student-apis';
import { StudentFormData } from '@/pages/AddStudentPage';
import { toast } from 'sonner';


interface UseStudentSubmissionProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useStudentSubmission = ({ onSuccess, onError }: UseStudentSubmissionProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitStudentData = async (formData:StudentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit each part of the student data in sequence
 
        console.log(JSON.stringify(formData,null,2));
       console.log("Form data 1:", formData.personalDetails );
       console.log("Form data 2:", formData.familyDetails );
        console.log("Form data 3:", formData.addressDetails );
        console.log("Form data 4:", formData.healthDetails );
        console.log("Form data 5:", formData.academicHistory );
        console.log("Form data 6:", formData.academicIdentifier );
        console.log("Form data 7:", formData.accommodation );
        console.log("Form data 8:", formData.emergencyContact );

        
        const personalDetailsResponse = await createPersonalDetails(formData.personalDetails);
      const familyDetailsResponse = await createFamilyDetails(formData.familyDetails);
      const addressDetailsResponse = await createAddressDetails(formData.addressDetails);
      const healthDetailsResponse = await createHealthDetails(formData.healthDetails);
      const emergencyContactResponse = await createEmergencyContact(formData.emergencyContact);
      const academicHistoryResponse = await createAcademicHistory(formData.academicHistory);
      const academicIdentifierResponse = await createAcademicIdentifier(formData.academicIdentifier);
      const accommodationResponse = await createAccommodation(formData.accommodation);
      // If all submissions are successful
      toast.success('Student data submitted successfully!');
      onSuccess?.();

      return {
        academicHistory: academicHistoryResponse,
        academicIdentifier: academicIdentifierResponse,
        emergencyContact: emergencyContactResponse,
        accommodation: accommodationResponse,
        familyDetails: familyDetailsResponse,
        healthDetails: healthDetailsResponse,
        personalDetails: personalDetailsResponse,
        addressDetails: addressDetailsResponse
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit student data');
      setError(error);
      toast.error(error.message);
      onError?.(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitStudentData,
    isSubmitting,
    error
  };
}; 