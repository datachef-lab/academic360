import { createInsertSchema } from "drizzle-zod";
import {
  documents,
  admissionCourses,
  occupations,
  address,
  applicationForms,
  academicSubjects,
  payments,
  studentAcademicSubjects,
  admissionCourseApplications,
  admissionGeneralInfo,
  admissionAdditionalInfo,
  admissions,
  annualIncomes,
  bloodGroup,
  categories,
  degree,
  nationality,
  religion,
  sportsInfo,
  admissionAcademicInfo,
  boardUniversities,
  cities,
  countries,
  institutions,
  languageMedium,
  sportsCategories,
  states,
  courses,
  departments,
  apps,
  sessions,
  academicYears,
  batches,
  classes,
  sections,
  shifts,
  batchPapers,
  subjectMetadatas,
  students,
  marksheets,
  users,
  offeredSubjects,
  papers,
  studentPapers,
  studyMaterials,
  subjects,
  specializations,
  subjectTypes,
  addons,
  feesReceiptTypes,
  feesStructures,
  person,
  health,
  qualifications,
  personalDetails,
  disabilityCodes,
  transportDetails,
  transport,
  pickupPoint,
  studentFeesMappings,
  instalments,
  familyDetails,
  emergencyContacts,
  accommodation,
  academicIdentifiers,
  academicHistory,
  boardResultStatus,
  feesComponents,
  feesHeads,
  feesSlabMapping,
  feesSlab
} from './schema';
import { z } from "zod";

export const createDocumentSchema = createInsertSchema(documents);
export type Document = z.infer<typeof createDocumentSchema>;

export const createAdmissionCourseSchema = createInsertSchema(admissionCourses);
export type AdmissionCourse = z.infer<typeof createAdmissionCourseSchema>;

export const createOccupationSchema = createInsertSchema(occupations);
export type Occupation = z.infer<typeof createOccupationSchema>;

export const createAddressSchema = createInsertSchema(address);
export type Address = z.infer<typeof createAddressSchema>;

export const createApplicationFormSchema = createInsertSchema(applicationForms);
export type ApplicationForm = z.infer<typeof createApplicationFormSchema>;

export const createAcademicSubjectSchema = createInsertSchema(academicSubjects);
export type AcademicSubject = z.infer<typeof createAcademicSubjectSchema>;

export const createPaymentSchema = createInsertSchema(payments);
export type Payment = z.infer<typeof createPaymentSchema>;

export const createStudentAcademicSubjectSchema = createInsertSchema(studentAcademicSubjects);
export type StudentAcademicSubject = z.infer<typeof createStudentAcademicSubjectSchema>;

export const createAdmissionCourseApplicationSchema = createInsertSchema(admissionCourseApplications);
export type AdmissionCourseApplication = z.infer<typeof createAdmissionCourseApplicationSchema>;

export const createAdmissionGeneralInfoSchema = createInsertSchema(admissionGeneralInfo);
export type AdmissionGeneralInfo = z.infer<typeof createAdmissionGeneralInfoSchema>;

export const createAdmissionAdditionalInfoSchema = createInsertSchema(admissionAdditionalInfo);
export type AdmissionAdditionalInfo = z.infer<typeof createAdmissionAdditionalInfoSchema>;

export const createAdmissionSchema = createInsertSchema(admissions);
export type Admission = z.infer<typeof createAdmissionSchema>;

export const createAnnualIncomeSchema = createInsertSchema(annualIncomes);
export type AnnualIncome = z.infer<typeof createAnnualIncomeSchema>;

export const createBloodGroupSchema = createInsertSchema(bloodGroup);
export type BloodGroup = z.infer<typeof createBloodGroupSchema>;

export const createCategorySchema = createInsertSchema(categories);
export type Category = z.infer<typeof createCategorySchema>;

export const createDegreeSchema = createInsertSchema(degree);
export type Degree = z.infer<typeof createDegreeSchema>;

export const createNationalitySchema = createInsertSchema(nationality);
export type Nationality = z.infer<typeof createNationalitySchema>;

export const createReligionSchema = createInsertSchema(religion);
export type Religion = z.infer<typeof createReligionSchema>;

export const createSportsInfoSchema = createInsertSchema(sportsInfo);
export type SportsInfo = z.infer<typeof createSportsInfoSchema>;

export const createAdmissionAcademicInfoSchema = createInsertSchema(admissionAcademicInfo);
export type AdmissionAcademicInfo = z.infer<typeof createAdmissionAcademicInfoSchema>;

export const createBoardUniversitySchema = createInsertSchema(boardUniversities);
export type BoardUniversity = z.infer<typeof createBoardUniversitySchema>;

export const createCitySchema = createInsertSchema(cities);
export type City = z.infer<typeof createCitySchema>;

export const createCountrySchema = createInsertSchema(countries);
export type Country = z.infer<typeof createCountrySchema>;

export const createInstitutionSchema = createInsertSchema(institutions);
export type Institution = z.infer<typeof createInstitutionSchema>;

export const createLanguageMediumSchema = createInsertSchema(languageMedium);
export type LanguageMedium = z.infer<typeof createLanguageMediumSchema>;

export const createSportsCategorySchema = createInsertSchema(sportsCategories);
export type SportsCategory = z.infer<typeof createSportsCategorySchema>;

export const createStateSchema = createInsertSchema(states);
export type State = z.infer<typeof createStateSchema>;

export const createCourseSchema = createInsertSchema(courses);
export type Course = z.infer<typeof createCourseSchema>;

export const createDepartmentSchema = createInsertSchema(departments)
export type Department = z.infer<typeof createDepartmentSchema>;

export const createAppSchema = createInsertSchema(apps);
export type App = z.infer<typeof createAppSchema>;

export const createSessionSchema = createInsertSchema(sessions);
export type Session = z.infer<typeof createSessionSchema>;

export const createAcademicYearSchema = createInsertSchema(academicYears);
export type AcademicYear = z.infer<typeof createAcademicYearSchema>;

export const createBatchSchema = createInsertSchema(batches);
export type Batch = z.infer<typeof createBatchSchema>;

export const createClassSchema = createInsertSchema(classes);
export type Class = z.infer<typeof createClassSchema>;

export const createSectionSchema = createInsertSchema(sections);
export type Section = z.infer<typeof createSectionSchema>;

export const createShiftSchema = createInsertSchema(shifts);
export type Shift = z.infer<typeof createShiftSchema>;

export const createBatchPaperSchema = createInsertSchema(batchPapers);
export type BatchPaper = z.infer<typeof createBatchPaperSchema>;

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadatas);
export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;

export const createStudentSchema = createInsertSchema(students);
export type Student = z.infer<typeof createStudentSchema>;

export const createMarksheetSchema = createInsertSchema(marksheets);
export type Marksheet = z.infer<typeof createMarksheetSchema>;

export const createUserSchema = createInsertSchema(users);
export type User = z.infer<typeof createUserSchema>;

export const createOfferedSubjectSchema = createInsertSchema(offeredSubjects);
export type OfferedSubject = z.infer<typeof createOfferedSubjectSchema>;

export const createPaperSchema = createInsertSchema(papers);
export type Paper = z.infer<typeof createPaperSchema>;

export const createStudentPaperSchema = createInsertSchema(studentPapers);
export type StudentPaper = z.infer<typeof createStudentPaperSchema>;

export const createStudyMaterialSchema = createInsertSchema(studyMaterials);
export type StudyMaterial = z.infer<typeof createStudyMaterialSchema>;

export const createSubjectSchema = createInsertSchema(subjects);
export type Subject = z.infer<typeof createSubjectSchema>;

export const createSpecializationSchema = createInsertSchema(specializations);
export type Specialization = z.infer<typeof createSpecializationSchema>;

export const createSubjectTypeSchema = createInsertSchema(subjectTypes);
export type SubjectType = z.infer<typeof createSubjectTypeSchema>;

export const createAddonSchema = createInsertSchema(addons);
export type Addon = z.infer<typeof createAddonSchema>;

export const createFeesReceiptTypeSchema = createInsertSchema(feesReceiptTypes);
export type FeesReceiptType = z.infer<typeof createFeesReceiptTypeSchema>;

export const createFeesStructureSchema = createInsertSchema(feesStructures);
export type FeesStructure = z.infer<typeof createFeesStructureSchema>;

export const createPersonSchema = createInsertSchema(person);
export type Person = z.infer<typeof createPersonSchema>;

export const createHealthSchema = createInsertSchema(health);
export type Health = z.infer<typeof createHealthSchema>;

export const createQualificationSchema = createInsertSchema(qualifications);
export type Qualification = z.infer<typeof createQualificationSchema>;

export const createPersonalDetailSchema = createInsertSchema(personalDetails);
export type PersonalDetail = z.infer<typeof createPersonalDetailSchema>;

export const createDisabilityCodeSchema = createInsertSchema(disabilityCodes);
export type DisabilityCode = z.infer<typeof createDisabilityCodeSchema>;

export const createTransportDetailSchema = createInsertSchema(transportDetails);
export type TransportDetail = z.infer<typeof createTransportDetailSchema>;

export const createTransportSchema = createInsertSchema(transport);
export type Transport = z.infer<typeof createTransportSchema>;

export const createPickupPointSchema = createInsertSchema(pickupPoint);
export type PickupPoint = z.infer<typeof createPickupPointSchema>;

export const createStudentFeesMappingSchema = createInsertSchema(studentFeesMappings);
export type StudentFeesMapping = z.infer<typeof createStudentFeesMappingSchema>;

export const createInstalmentSchema = createInsertSchema(instalments);
export type Instalment = z.infer<typeof createInstalmentSchema>;

export const createFamilyDetailSchema = createInsertSchema(familyDetails);
export type FamilyDetail = z.infer<typeof createFamilyDetailSchema>;

export const createEmergencyContactSchema = createInsertSchema(emergencyContacts);
export type EmergencyContact = z.infer<typeof createEmergencyContactSchema>;

export const createAccommodationSchema = createInsertSchema(accommodation);
export type Accommodation = z.infer<typeof createAccommodationSchema>;

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifiers);
export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;

export const createAcademicHistorySchema = createInsertSchema(academicHistory);
export type AcademicHistory = z.infer<typeof createAcademicHistorySchema>;

export const createBoardResultStatusSchema = createInsertSchema(boardResultStatus);
export type BoardResultStatus = z.infer<typeof createBoardResultStatusSchema>;

export const createFeesComponentSchema = createInsertSchema(feesComponents);
export type FeesComponent = z.infer<typeof createFeesComponentSchema>;

export const createFeesHeadSchema = createInsertSchema(feesHeads);
export type FeesHead = z.infer<typeof createFeesHeadSchema>;

export const createFeesSlabMappingSchema = createInsertSchema(feesSlabMapping);
export type FeesSlabMapping = z.infer<typeof createFeesSlabMappingSchema>;

export const createFeesSlabSchema = createInsertSchema(feesSlab);
export type FeesSlab = z.infer<typeof createFeesSlabSchema>;
