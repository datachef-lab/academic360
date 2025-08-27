import { ReactNode } from 'react';

export interface SportsEntry {
  srNo: string;
  sports: string;
  level: string;
}

export interface FormData {
  // General Information
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  dateOfBirth: string;
  nationality?: string;
  otherNationality?: string;
  category?: string;
  isGujarati?: boolean;
  gender?: string;
  isKolkataResident?: boolean;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  wbDomicileCertificate?: string;
  password?: string;
  confirmPassword?: string;
  degree?: string;

  // Academic Information
  previousEducation: string;
  gpa: string;
  graduationYear: string;
  institution: string;
  major: string;
  academicReferences: string;

  // Course Application
  program: string;
  startDate: string;
  studyMode: string;
  campus: string;
  specializations: string[];

  // Additional Information
  workExperience: string;
  extracurriculars: string;
  personalStatement: string;
  emergencyContact: string;
  emergencyPhone: string;
  alternateMobile?: string;
  bloodGroup?: string;
  religion?: string;
  physicallyChallenged?: string;
  typeOfPhysicallyChallenged?: string;
  singleParent?: string;
  fatherTitle?: string;
  fatherName?: string;
  motherTitle?: string;
  motherName?: string;
  isParentStaff?: string;
  parentStaffName?: string;
  parentStaffDepartment?: string;
  hasSmartphone?: string;
  hasLaptopDesktop?: string;
  hasInternet?: string;
  annualFamilyIncome?: string;
  applyNCC?: string;
  applySports?: string;

  // Payment
  paymentMethod: string;
  scholarships: boolean;
  financialAid: boolean;
  boardResultStatus?: string;
  boardUniversity?: string;
  subjectMarks?: {
    id: number;
    subject?: string;
    totalMarks?: number;
    obtainedMarks?: number;
    status?: string;
  }[];

  // Sports Category Fields
  sportsEntries?: SportsEntry[];
}

export interface StepProps {
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: any) => void;
  stepNotes?: ReactNode;
}

export interface Step {
  number: number;
  title: string;
}

// Assuming these interfaces exist based on component names used in page.tsx
// Adding stepNotes prop to match usage in page.tsx
export interface CourseApplicationStepProps extends StepProps {}
export interface PaymentStepProps extends StepProps {}
