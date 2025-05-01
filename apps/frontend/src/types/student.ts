export interface PersonalDetails {
  name: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  category: string;
  handicapped: string;
}

export interface ParentDetails {
  fatherName: string;
  fatherOccupation: string;
  fatherContact: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherContact: string;
  motherEmail: string;
  annualIncome: string;
  address: string;
}

export interface GuardianDetails {
  guardianName: string;
  relationship: string;
  occupation: string;
  contactNumber: string;
  email: string;
  address: string;
  isLocalGuardian: string;
}

export interface HealthDetails {
  bloodGroup: string;
  height: string;
  weight: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  emergencyContact: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  lastCheckupDate: string;
  doctorName: string;
  doctorContact: string;
}

export interface EmergencyContact {
  primaryContactName: string;
  primaryContactRelationship: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  primaryContactAddress: string;
  secondaryContactName: string;
  secondaryContactRelationship: string;
  secondaryContactPhone: string;
  secondaryContactEmail: string;
  secondaryContactAddress: string;
}

export interface AcademicHistory {
  previousSchool: string;
  previousSchoolAddress: string;
  previousSchoolBoard: string;
  previousSchoolYear: string;
  previousSchoolGrade: string;
  previousSchoolSubjects: string;
  previousSchoolActivities: string;
  previousSchoolAwards: string;
  previousSchoolReasonForLeaving: string;
}

export interface AcademicIdentifier {
  registrationNumber: string;
  rollNumber: string;
  uid: string;
  course: string;
  specialization: string;
  year: string;
  semester: string;
  section: string;
  batch: string;
  shift: string;
}

export interface Accommodation {
  accommodationType: string;
  hostelName: string;
  roomNumber: string;
  block: string;
  floor: string;
  checkInDate: string;
  checkOutDate: string;
  monthlyRent: string;
  depositAmount: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
}

export interface StudentFormData {
  personalDetails: PersonalDetails;
  parentDetails: ParentDetails;
  guardianDetails: GuardianDetails;
  healthDetails: HealthDetails;
  emergencyContact: EmergencyContact;
  academicHistory: AcademicHistory;
  academicIdentifier: AcademicIdentifier;
  accommodation: Accommodation;
} 