import { FormData } from "../../types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import SubjectMarksModal from "./SubjectMarksModal";
import InstituteDetailsModal from "./InstituteDetailsModal";
import { ApplicationForm, boardResultStatusType, LanguageMedium, StudentAcademicSubject, Course, Institution } from "@/db/schema";
import { AdmissionAcademicInfoDto, ApplicationFormDto, BoardUniversityDto } from "@/types/admissions";
import { useParams } from "next/navigation";
import { getCourses } from "../../action";
import { toast } from "@/components/ui/use-toast";

// Define a type for Academic Subject for fetching
interface AcademicSubject { id: number; name: string; }

interface AcademicInfoStepProps {
  stepNotes: React.ReactNode;
  applicationForm: ApplicationFormDto;
  academicInfo: AdmissionAcademicInfoDto;
  setAcademicInfo: React.Dispatch<React.SetStateAction<AdmissionAcademicInfoDto>>;
  onNext: () => void;
  onPrev: () => void;
  currentStep: number;
}

interface SubjectMark {
  subject: string;
  totalMarks: number | '';
  marksObtained: number | '';
  resultStatus: string;
}

interface InstituteDetails {
  rollNo: string;
  schoolNo: string;
  centerNo: string;
  admitCardId: string;
  institute: string;
  otherInstitute: string;
  medium: string;
  yearOfPassing: string;
  stream: string;
  calcuttaUniversityRegistered: string;
  calcuttaUniversityRegistrationNo: string;
  previouslyRegisteredCourse: string;
  otherCourse: string;
  previousCollege: string;
  otherCollege: string;
}

export default function AcademicInfoStep({ 
  applicationForm, 
  stepNotes, 
  academicInfo, 
  setAcademicInfo,
  onNext,
  onPrev,
  currentStep
}: AcademicInfoStepProps) {
  const params = useParams();
  const admissionYear = parseInt(params.year as string);
  
  // Generate year options (current year and 3 years back)
  const yearOptions = Array.from({ length: 4 }, (_, i) => admissionYear - i);

  
  const [boardUniversities, setBoardUniversities] = useState<BoardUniversityDto[]>([]);
  const [languageMediums, setLanguageMediums] = useState<LanguageMedium[]>([]);
  // const [colleges, setColleges] = useState<College[]>([]);
  const [academicSubjects, setAcademicSubjects] = useState<AcademicSubject[]>([]); // New state for academic subjects
  const [courses, setCourses] = useState<Course[]>([]); // New state for courses
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  console.log('academicSubjects in AcademicInfoStep:', academicSubjects);

  const [showMarksEntryModal, setShowMarksEntryModal] = useState(false);
  const [showInstituteDetailsModal, setShowInstituteDetailsModal] = useState(false);
  const [enteredInstituteDetails, setEnteredInstituteDetails] = useState<InstituteDetails | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch board universities
        const boardUniversitiesResponse = await fetch('/api/board-universities');
        if (boardUniversitiesResponse.ok) {
          const data = await boardUniversitiesResponse.json();
          setBoardUniversities(data);
        } else {
          console.error('Failed to fetch board universities:', boardUniversitiesResponse.status);
        }

        // Fetch language mediums
        const languageMediumsResponse = await fetch('/api/language-mediums');
        if (languageMediumsResponse.ok) {
          const {data} = await languageMediumsResponse.json();
          setLanguageMediums(data);
        } else {
          console.error('Failed to fetch language mediums:', languageMediumsResponse.status);
        }

        // Fetch institutions
        const institutionsResponse = await fetch('/api/institutions');
        if (institutionsResponse.ok) {
          const {data} = await institutionsResponse.json();
          setInstitutions(data);
        } else {
          console.error('Failed to fetch language mediums:', institutionsResponse.status);
        }


        // Fetch courses
        try {
        const coursesResponse = await getCourses();
        setCourses(coursesResponse);
        } catch (error) {
          console.error('Failed to fetch courses:', error);
        }

        // Fetch academic subjects
        const academicSubjectsResponse = await fetch('/api/academic-subjects');
        if (academicSubjectsResponse.ok) {
          const data = await academicSubjectsResponse.json();
          if (data.success && Array.isArray(data.data)) {
            setAcademicSubjects(data.data);
          } else {
            console.error('API response for academic subjects was not successful or data was not an array:', data);
            setAcademicSubjects([]);
          }
        } else {
          console.error('Failed to fetch academic subjects:', academicSubjectsResponse.status, academicSubjectsResponse.statusText);
          setAcademicSubjects([]);
        }

        // Load existing academic info if available
        if (applicationForm.id) {
          try {
            const existingAcademicInfoResponse = await fetch(`/api/admissions/academic-info?applicationFormId=${applicationForm.id}`);
            if (existingAcademicInfoResponse.ok) {
              const existingData = await existingAcademicInfoResponse.json();
              if (existingData) {
                setAcademicInfo(prev => ({
                  ...prev,
                  ...existingData
                }));
                
                // If there are institute details, populate the enteredInstituteDetails state
                if (existingData.rollNumber || existingData.instituteId) {
                  const institute = institutions.find(c => c.id === existingData.instituteId);
                  const medium = languageMediums.find(m => m.id === existingData.languageMediumId);
                  const previousCollege = institutions.find(c => c.id === existingData.previousCollegeId);
                  
                  setEnteredInstituteDetails({
                    rollNo: existingData.rollNumber || '',
                    schoolNo: existingData.schoolNumber || '',
                    centerNo: existingData.centerNumber || '',
                    admitCardId: existingData.admitCardId || '',
                    institute: institute?.name || '',
                    otherInstitute: existingData.otherInstitute || '',
                    medium: medium?.name || '',
                    yearOfPassing: existingData.yearOfPassing?.toString() || '',
                    stream: existingData.streamType || '',
                    calcuttaUniversityRegistered: existingData.isRegisteredForUGInCU ? 'Yes' : 'No',
                    calcuttaUniversityRegistrationNo: existingData.cuRegistrationNumber || '',
                    previouslyRegisteredCourse: '',
                    otherCourse: existingData.otherPreviouslyRegisteredCourse || '',
                    previousCollege: previousCollege?.name || '',
                    otherCollege: existingData.otherCollege || ''
                  });
                }
              }
            } else {
              console.error('Failed to fetch existing academic info:', existingAcademicInfoResponse.status);
            }
          } catch (error) {
            console.error('Error fetching existing academic info:', error);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load form data. Please refresh the page.",
          variant: "destructive",
          // onClose: () => {},
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [applicationForm.id]);

  // Helper to find subject name by ID
  const getSubjectName = (id: number) => {
    const subject = (academicSubjects || []).find(sub => sub.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  // Effect to clear subjects when boardUniversityId changes
  useEffect(() => {
    if (academicInfo.boardUniversityId !== 0 && academicInfo.subjects.length > 0) {
      setAcademicInfo(prev => ({
        ...prev,
        subjects: []
      }));
    }
  }, [academicInfo.boardUniversityId]);

  const handleAcademicInfoChange = (field: keyof AdmissionAcademicInfoDto, value: any) => {
    setAcademicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenMarksEntry = () => {
    // If no subjects are entered, add 4 default rows
    if (academicInfo.subjects.length === 0) {
      const defaultSubjects: StudentAcademicSubject[] = Array.from({ length: 4 }, () => ({
        applicationFormId: academicInfo.applicationFormId,
        academicSubjectId: 0, // Placeholder, will be selected in modal
        fullMarks: '0',
        totalMarks: '0',
        resultStatus: "PASS" as "PASS" | "FAIL" | "FAIL IN THEORY" | "FAIL IN PRACTICAL", // Explicitly cast to the correct union type
        admissionAcademicInfoId: academicInfo.id ?? 0,
      }));
      setAcademicInfo(prev => ({
        ...prev,
        subjects: defaultSubjects
      }));
    }
    setShowMarksEntryModal(true);
  };

  const handleCloseMarksEntry = () => {
    setShowMarksEntryModal(false);
  };  

  const handleSaveMarksEntry = (subjects: StudentAcademicSubject[]) => {
    // Store subjects in academicInfo state
    setAcademicInfo(prev => ({
      ...prev,
      subjects: subjects
    }));
  };

  const handleOpenInstituteDetails = () => {
    setShowInstituteDetailsModal(true);
  };

  const handleCloseInstituteDetails = () => {
    setShowInstituteDetailsModal(false);
  };

  const handleSaveInstituteDetails = (details: InstituteDetails) => {
    setEnteredInstituteDetails(details);
    // Update academicInfo with institute details
    setAcademicInfo(prev => ({
      ...prev,
      rollNumber: details.rollNo,
      schoolNumber: details.schoolNo,
      centerNumber: details.centerNo,
      admitCardId: details.admitCardId,
      instituteId: (institutions || []).find(i => i.name === details.institute)?.id ?? 0,
      otherInstitute: details.institute === 'Other Institute' ? details.otherInstitute : null,
      languageMediumId: languageMediums.find(m => m.name === details.medium)?.id ?? 0,
      yearOfPassing: parseInt(details.yearOfPassing),
      streamType: details.stream as "COMMERCE" | "SCIENCE" | "HUMANITIES",
      isRegisteredForUGInCU: details.calcuttaUniversityRegistered === 'Yes',
      cuRegistrationNumber: details.calcuttaUniversityRegistered === 'Yes' ? details.calcuttaUniversityRegistrationNo : null,
      previousCollegeId: institutions.find(c => c.name === details.previousCollege)?.id ?? 0,
      otherCollege: details.previousCollege === 'Other college' ? details.otherCollege : null,
      previouslyRegisteredCourseId: 0,
      otherPreviouslyRegisteredCourse: details.previouslyRegisteredCourse === 'Other Course' ? details.otherCourse : null,
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!academicInfo.boardResultStatus) {
      errors.boardResultStatus = "Board result status is required";
    }
    if (!academicInfo.boardUniversityId) {
      errors.boardUniversityId = "Board/University is required";
    }
    if (!academicInfo.instituteId && !academicInfo.otherInstitute) {
      errors.instituteId = "Institute details are required";
    }
    if (!academicInfo.languageMediumId) {
      errors.languageMediumId = "Language medium is required";
    }
    if (!academicInfo.yearOfPassing) {
      errors.yearOfPassing = "Year of passing is required";
    }
    if (!academicInfo.streamType) {
      errors.streamType = "Stream type is required";
    }
    if (academicInfo.isRegisteredForUgInCu && !academicInfo.cuRegistrationNumber) {
      errors.cuRegistrationNumber = "CU registration number is required";
    }
    
    // Validate subjects
    if (academicInfo.subjects.length === 0) {
      errors.subjects = "At least one subject is required";
    } else {
      for (let i = 0; i < academicInfo.subjects.length; i++) {
        const subject = academicInfo.subjects[i];
        if (!subject.academicSubjectId || subject.academicSubjectId === 0) {
          errors[`subject_${i}`] = `Subject ${i + 1} is required`;
        }
        if (!subject.fullMarks || subject.fullMarks === '0') {
          errors[`fullMarks_${i}`] = `Total marks for subject ${i + 1} is required`;
        }
        if (!subject.totalMarks || subject.totalMarks === '0') {
          errors[`totalMarks_${i}`] = `Marks obtained for subject ${i + 1} is required`;
        }
      }
    }

    // Validate institute details
    if (!academicInfo.rollNumber) {
      errors.rollNumber = "Roll number is required";
    }
    if (!academicInfo.schoolNumber) {
      errors.schoolNumber = "School number is required";
    }
    if (!academicInfo.centerNumber) {
      errors.centerNumber = "Center number is required";
    }
    if (!academicInfo.admitCardId) {
      errors.admitCardId = "Admit card ID is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper to check if all subject rows are valid
  const areSubjectsValid = (subjects: StudentAcademicSubject[]) => {
    if (!subjects || subjects.length === 0) return false;
    const seenSubjects = new Set();
    for (const subject of subjects) {
      if (!subject.academicSubjectId || subject.academicSubjectId === 0) return false;
      if (!subject.fullMarks || subject.fullMarks === '' || subject.fullMarks === '0') return false;
      if (!subject.totalMarks || subject.totalMarks === '' || subject.totalMarks === '0') return false;
      if (seenSubjects.has(subject.academicSubjectId)) return false;
      seenSubjects.add(subject.academicSubjectId);
    }
    return true;
  };

  // Helper to check if all required institute details are filled
  const areInstituteDetailsValid = (info: AdmissionAcademicInfoDto) => {
    return (
      !!info.rollNumber &&
      !!info.schoolNumber &&
      !!info.centerNumber &&
      !!info.admitCardId &&
      !!info.instituteId &&
      !!info.languageMediumId &&
      !!info.yearOfPassing &&
      !!info.streamType
    );
  };

  const handleNext = async () => {
    if (!validateForm()) {
      // Show all error messages in a toast
      const errorList = Object.values(formErrors).join('\n');
      toast({
        title: "Validation Error",
        description: errorList,
        variant: "destructive",
        duration: 8000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, save the academic info
      const { createdAt, updatedAt, ...academicInfoData } = {
        ...academicInfo,
        applicationFormId: applicationForm.id
      };

      let academicInfoResponse;
      if (academicInfo.id && academicInfo.id !== 0) {
        // Update existing academic info
        academicInfoResponse = await fetch(`/api/admissions/academic-info?id=${academicInfo.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(academicInfoData),
        });
      } else {
        // Create new academic info
        academicInfoResponse = await fetch("/api/admissions/academic-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(academicInfoData),
        });
      }

      if (!academicInfoResponse.ok) {
        const errorData = await academicInfoResponse.json();
        throw new Error(errorData.message || "Failed to save academic info");
      }

      const savedAcademicInfo = await academicInfoResponse.json();

      // Update the academic info with the saved data (including the ID)
      setAcademicInfo(prev => ({
        ...prev,
        id: savedAcademicInfo.id,
        subjects: savedAcademicInfo.subjects || prev.subjects
      }));

      // Save subjects if they exist
      if (academicInfo.subjects.length > 0) {
        for (const subject of academicInfo.subjects) {
          const subjectData = {
            ...subject,
            admissionAcademicInfoId: savedAcademicInfo.id,
            applicationFormId: applicationForm.id
          };
          delete subjectData.createdAt;
          delete subjectData.updatedAt;

          let subjectResponse;
          if (subject.id) {
            // Update existing subject
            subjectResponse = await fetch(`/api/admissions/academic-info/subjects?id=${subject.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subjectData),
            });
          } else {
            // Create new subject
            subjectResponse = await fetch("/api/admissions/academic-info/subjects", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subjectData),
            });
          }

          if (!subjectResponse.ok) {
            const errorData = await subjectResponse.json();
            throw new Error(errorData.message || "Failed to save subject");
          }
        }
      }

      // Update the application form
      const formData = {
        form: {
          admissionId: applicationForm.admissionId,
          admissionStep: academicInfo.id == 0 ? "COURSE_APPLICATION" : applicationForm.admissionStep,
          formStatus: applicationForm.formStatus
        }
      } as { form: ApplicationForm};

      const formResponse = await fetch(`/api/admissions/application-forms?id=${applicationForm.id}`, {
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

      toast({
        title: "Success",
        description: "Academic information saved successfully",
        // onClose: () => {},
      });

      onNext();
    } catch (error) {
      console.error("Error saving academic info:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save academic information",
        variant: "destructive",
        // onClose: () => {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onPrev();
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // Save academic info without validation
      const { createdAt: createdAtDraft, updatedAt: updatedAtDraft, ...academicInfoDataDraft } = {
        ...academicInfo,
        applicationFormId: applicationForm.id
      };

      let academicInfoResponse;
      if (academicInfo.id && academicInfo.id !== 0) {
        academicInfoResponse = await fetch(`/api/admissions/academic-info?id=${academicInfo.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(academicInfoDataDraft),
        });
      } else {
        academicInfoResponse = await fetch("/api/admissions/academic-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(academicInfoDataDraft),
        });
      }

      if (!academicInfoResponse.ok) {
        const errorData = await academicInfoResponse.json();
        throw new Error(errorData.message || "Failed to save academic info");
      }

      const savedAcademicInfo = await academicInfoResponse.json();

      // Update the academic info with the saved data
      setAcademicInfo(prev => ({
        ...prev,
        id: savedAcademicInfo.id,
        subjects: savedAcademicInfo.subjects || prev.subjects
      }));

      // Save subjects if they exist
      if (academicInfo.subjects.length > 0) {
        for (const subject of academicInfo.subjects) {
          const subjectData = {
            ...subject,
            admissionAcademicInfoId: savedAcademicInfo.id,
            applicationFormId: applicationForm.id
          };
          delete subjectData.createdAt;
          delete subjectData.updatedAt;

          let subjectResponse;
          if (subject.id) {
            subjectResponse = await fetch(`/api/admissions/academic-info/subjects?id=${subject.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subjectData),
            });
          } else {
            subjectResponse = await fetch("/api/admissions/academic-info/subjects", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subjectData),
            });
          }

          if (!subjectResponse.ok) {
            const errorData = await subjectResponse.json();
            throw new Error(errorData.message || "Failed to save subject");
          }
        }
      }

      toast({
        title: "Draft Saved",
        description: "Your progress has been saved as a draft",
        // onClose: () => {},
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
        // onClose: () => {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form data...</p>
          </div>
        </div>
      )}
      
      {!isLoading && (
        <>
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold mb-2">Step 2 of 5 - Academic Details (Sr. No. 14 to 17)</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow p-3 sm:p-4 text-left text-sm">
          {stepNotes}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <Label className="flex items-center mb-1 text-sm">14. Board Result Status <span className="text-red-600">*</span></Label>
          <Select 
            value={academicInfo.boardResultStatus} 
            onValueChange={(val) => handleAcademicInfoChange("boardResultStatus", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {boardResultStatusType.enumValues.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="flex items-center mb-1 text-sm">15. Board/University <span className="text-red-600">*</span></Label>
          <Select 
            value={academicInfo.boardUniversityId === 0 ? "0" : academicInfo.boardUniversityId.toString()} 
            onValueChange={(val) => handleAcademicInfoChange("boardUniversityId", parseInt(val))}
            disabled={academicInfo.boardResultStatus !== "PASS"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Board/University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select Board/University</SelectItem>
              {boardUniversities.map((board) => (
                board.id && (
                  <SelectItem key={board.id} value={board.id.toString()}>
                    {board.name}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
          {academicInfo.boardResultStatus !== "PASS" && (
            <p className="text-sm text-red-600 mt-2">
              Failed or Compartmental students are not allowed to apply as per Calcutta University Norms.
            </p>
          )}
        </div>

        <div>
          <Label className="flex items-center mb-1 text-sm">16. Subjectwise Marks <span className="text-red-600">*</span></Label>
          <Dialog open={showMarksEntryModal} onOpenChange={setShowMarksEntryModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenMarksEntry} 
                className="w-full sm:w-auto"
                disabled={academicInfo.boardUniversityId === 0}
              >Marks Entry</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-screen-xl max-h-[95vh] p-4 sm:p-6">
              <DialogTitle>Marks Entry</DialogTitle>
              <SubjectMarksModal 
                onSave={handleSaveMarksEntry} 
                onClose={handleCloseMarksEntry} 
                academicSubjects={academicSubjects}
                initialSubjects={academicInfo.subjects}
              />
            </DialogContent>
          </Dialog>

          {academicInfo.subjects.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-md border max-h-[300px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl</th>
                    <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sm:w-48">Subject</th>
                    <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                    <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                    <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sm:w-40">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {academicInfo.subjects.map((subject: StudentAcademicSubject, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{getSubjectName(subject.academicSubjectId)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{subject.fullMarks}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{subject.totalMarks}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{subject.resultStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center mb-1 text-sm">17. Institute Details <span className="text-red-600">*</span></Label>
          <Dialog open={showInstituteDetailsModal} onOpenChange={setShowInstituteDetailsModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenInstituteDetails} 
                className="w-full sm:w-auto"
                disabled={academicInfo.boardResultStatus !== "PASS" || academicInfo.boardUniversityId === 0}
              >Institute Details Entry</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-screen-lg max-h-[95vh] p-4 sm:p-6">
              <DialogTitle>Institute Details</DialogTitle>
              <InstituteDetailsModal 
              institutions={institutions}
              colleges={institutions}
                languageMediums={languageMediums}
                onChange={handleAcademicInfoChange} 
                onClose={handleCloseInstituteDetails} 
                academicInfo={academicInfo}
                registeredCourses={courses}
              />
            </DialogContent>
          </Dialog>

          {enteredInstituteDetails && (
            <div className="mt-4 p-3 sm:p-4 border rounded-md bg-gray-50">
              <p className="font-semibold mb-2 text-sm sm:text-base">Entered Institute Details:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <p><strong>Roll No:</strong> {enteredInstituteDetails.rollNo}</p>
                <p><strong>School No:</strong> {enteredInstituteDetails.schoolNo}</p>
                <p><strong>Center No:</strong> {enteredInstituteDetails.centerNo}</p>
                <p><strong>Admit Card ID:</strong> {enteredInstituteDetails.admitCardId}</p>
                <p><strong>Institute:</strong> {enteredInstituteDetails.institute}</p>
                {enteredInstituteDetails.institute === 'Other Institute' && (
                  <p><strong>Other Institute:</strong> {enteredInstituteDetails.otherInstitute}</p>
                )}
                <p><strong>Medium:</strong> {enteredInstituteDetails.medium}</p>
                <p><strong>Year Of Passing:</strong> {enteredInstituteDetails.yearOfPassing}</p>
                <p><strong>Stream:</strong> {enteredInstituteDetails.stream}</p>
                <p><strong>Calcutta University Registered:</strong> {enteredInstituteDetails.calcuttaUniversityRegistered}</p>
                {enteredInstituteDetails.calcuttaUniversityRegistered === 'Yes' && (
                  <p><strong>Calcutta University Registration No:</strong> {enteredInstituteDetails.calcuttaUniversityRegistrationNo}</p>
                )}
                <p><strong>Previously Registered Course:</strong> {enteredInstituteDetails.previouslyRegisteredCourse}</p>
                {enteredInstituteDetails.previouslyRegisteredCourse === 'Other Course' && (
                  <p><strong>Other Course:</strong> {enteredInstituteDetails.otherCourse}</p>
                )}
                <p><strong>Previous College:</strong> {enteredInstituteDetails.previousCollege}</p>
                {enteredInstituteDetails.previousCollege === 'Other college' && (
                  <p><strong>Other college:</strong> {enteredInstituteDetails.otherCollege}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save & Continue"}
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
        </>
      )}
    </div>
  );
}
