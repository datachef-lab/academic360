import { relations } from "drizzle-orm/relations";
import { sessions, academicYears, batches, courses, classes, sections, shifts, degree, batchPapers, subjectMetadatas, specializations, subjectTypes, users, students, applicationForms, marksheets, offeredSubjects, papers, studentPapers, studyMaterials, subjects, boardUniversities, address, academicSubjects, admissions, admissionAdditionalInfo, bloodGroup, religion, categories, departments, annualIncomes, admissionAcademicInfo, institutions, languageMedium, admissionCourseApplications, admissionCourses, admissionGeneralInfo, nationality, sportsInfo, sportsCategories, studentAcademicSubjects, feesReceiptTypes, feesStructures, feesComponents, feesHeads, addons, feesSlabMapping, feesSlab, instalments, studentFeesMappings, payments, countries, states, cities, academicHistory, boardResultStatus, academicIdentifiers, accommodation, emergencyContacts, familyDetails, person, qualifications, occupations, health, personalDetails, disabilityCodes, transportDetails, transport, pickupPoint } from "./schema";

export const academicYearsRelations = relations(academicYears, ({one, many}) => ({
	session: one(sessions, {
		fields: [academicYears.sessionId],
		references: [sessions.id]
	}),
	batches: many(batches),
	admissions: many(admissions),
	feesStructures: many(feesStructures),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	academicYears: many(academicYears),
	batches: many(batches),
	studyMaterials: many(studyMaterials),
}));

export const batchesRelations = relations(batches, ({one, many}) => ({
	academicYear: one(academicYears, {
		fields: [batches.academicYearId],
		references: [academicYears.id]
	}),
	course: one(courses, {
		fields: [batches.courseId],
		references: [courses.id]
	}),
	class: one(classes, {
		fields: [batches.classId],
		references: [classes.id]
	}),
	section: one(sections, {
		fields: [batches.sectionId],
		references: [sections.id]
	}),
	shift: one(shifts, {
		fields: [batches.shiftId],
		references: [shifts.id]
	}),
	session: one(sessions, {
		fields: [batches.sessionId],
		references: [sessions.id]
	}),
	batchPapers: many(batchPapers),
	studentPapers: many(studentPapers),
	studyMaterials: many(studyMaterials),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	batches: many(batches),
	degree: one(degree, {
		fields: [courses.degreeId],
		references: [degree.id]
	}),
	studyMaterials: many(studyMaterials),
	admissionAcademicInfos: many(admissionAcademicInfo),
	admissionCourses: many(admissionCourses),
	feesStructures_courseId: many(feesStructures, {
		relationName: "feesStructures_courseId_courses_id"
	}),
	feesStructures_advanceForCourseId: many(feesStructures, {
		relationName: "feesStructures_advanceForCourseId_courses_id"
	}),
	academicIdentifiers: many(academicIdentifiers),
}));

export const classesRelations = relations(classes, ({many}) => ({
	batches: many(batches),
	subjectMetadatas: many(subjectMetadatas),
	marksheets: many(marksheets),
	feesStructures: many(feesStructures),
}));

export const sectionsRelations = relations(sections, ({many}) => ({
	batches: many(batches),
	academicIdentifiers: many(academicIdentifiers),
}));

export const shiftsRelations = relations(shifts, ({many}) => ({
	batches: many(batches),
	feesStructures: many(feesStructures),
	academicIdentifiers: many(academicIdentifiers),
}));

export const degreeRelations = relations(degree, ({many}) => ({
	courses: many(courses),
	subjectMetadatas: many(subjectMetadatas),
	boardUniversities: many(boardUniversities),
	institutions: many(institutions),
}));

export const batchPapersRelations = relations(batchPapers, ({one, many}) => ({
	batch: one(batches, {
		fields: [batchPapers.batchId],
		references: [batches.id]
	}),
	subjectMetadata: one(subjectMetadatas, {
		fields: [batchPapers.subjectMetadataId],
		references: [subjectMetadatas.id]
	}),
	studentPapers: many(studentPapers),
}));

export const subjectMetadatasRelations = relations(subjectMetadatas, ({one, many}) => ({
	batchPapers: many(batchPapers),
	degree: one(degree, {
		fields: [subjectMetadatas.degreeId],
		references: [degree.id]
	}),
	class: one(classes, {
		fields: [subjectMetadatas.classId],
		references: [classes.id]
	}),
	specialization: one(specializations, {
		fields: [subjectMetadatas.specializationId],
		references: [specializations.id]
	}),
	subjectType: one(subjectTypes, {
		fields: [subjectMetadatas.subjectTypeId],
		references: [subjectTypes.id]
	}),
	offeredSubjects: many(offeredSubjects),
	studyMaterials: many(studyMaterials),
	subjects: many(subjects),
}));

export const specializationsRelations = relations(specializations, ({many}) => ({
	subjectMetadatas: many(subjectMetadatas),
	students: many(students),
	academicHistories: many(academicHistory),
}));

export const subjectTypesRelations = relations(subjectTypes, ({many}) => ({
	subjectMetadatas: many(subjectMetadatas),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	user: one(users, {
		fields: [students.userId],
		references: [users.id]
	}),
	applicationForm: one(applicationForms, {
		fields: [students.applicationId],
		references: [applicationForms.id]
	}),
	specialization: one(specializations, {
		fields: [students.specializationId],
		references: [specializations.id]
	}),
	marksheets: many(marksheets),
	studentPapers: many(studentPapers),
	studentFeesMappings: many(studentFeesMappings),
	academicHistories: many(academicHistory),
	academicIdentifiers: many(academicIdentifiers),
	accommodations: many(accommodation),
	emergencyContacts: many(emergencyContacts),
	familyDetails: many(familyDetails),
	health: many(health),
	personalDetails: many(personalDetails),
	transportDetails: many(transportDetails),
}));

export const usersRelations = relations(users, ({many}) => ({
	students: many(students),
	marksheets_createdByUserId: many(marksheets, {
		relationName: "marksheets_createdByUserId_users_id"
	}),
	marksheets_updatedByUserId: many(marksheets, {
		relationName: "marksheets_updatedByUserId_users_id"
	}),
}));

export const applicationFormsRelations = relations(applicationForms, ({one, many}) => ({
	students: many(students),
	admission: one(admissions, {
		fields: [applicationForms.admissionId],
		references: [admissions.id]
	}),
	admissionAdditionalInfos: many(admissionAdditionalInfo),
	admissionAcademicInfos: many(admissionAcademicInfo),
	admissionCourseApplications: many(admissionCourseApplications),
	admissionGeneralInfos: many(admissionGeneralInfo),
	payments: many(payments),
}));

export const marksheetsRelations = relations(marksheets, ({one, many}) => ({
	student: one(students, {
		fields: [marksheets.studentId],
		references: [students.id]
	}),
	class: one(classes, {
		fields: [marksheets.classId],
		references: [classes.id]
	}),
	user_createdByUserId: one(users, {
		fields: [marksheets.createdByUserId],
		references: [users.id],
		relationName: "marksheets_createdByUserId_users_id"
	}),
	user_updatedByUserId: one(users, {
		fields: [marksheets.updatedByUserId],
		references: [users.id],
		relationName: "marksheets_updatedByUserId_users_id"
	}),
	subjects: many(subjects),
}));

export const offeredSubjectsRelations = relations(offeredSubjects, ({one, many}) => ({
	subjectMetadata: one(subjectMetadatas, {
		fields: [offeredSubjects.subjectMetadataId],
		references: [subjectMetadatas.id]
	}),
	papers: many(papers),
}));

export const papersRelations = relations(papers, ({one}) => ({
	offeredSubject: one(offeredSubjects, {
		fields: [papers.offeredSubjectId],
		references: [offeredSubjects.id]
	}),
}));

export const studentPapersRelations = relations(studentPapers, ({one}) => ({
	student: one(students, {
		fields: [studentPapers.studentId],
		references: [students.id]
	}),
	batchPaper: one(batchPapers, {
		fields: [studentPapers.batchPaperId],
		references: [batchPapers.id]
	}),
	batch: one(batches, {
		fields: [studentPapers.batchId],
		references: [batches.id]
	}),
}));

export const studyMaterialsRelations = relations(studyMaterials, ({one}) => ({
	subjectMetadata: one(subjectMetadatas, {
		fields: [studyMaterials.subjectMetadataId],
		references: [subjectMetadatas.id]
	}),
	session: one(sessions, {
		fields: [studyMaterials.sessionId],
		references: [sessions.id]
	}),
	course: one(courses, {
		fields: [studyMaterials.courseId],
		references: [courses.id]
	}),
	batch: one(batches, {
		fields: [studyMaterials.batchId],
		references: [batches.id]
	}),
}));

export const subjectsRelations = relations(subjects, ({one}) => ({
	marksheet: one(marksheets, {
		fields: [subjects.marksheetId],
		references: [marksheets.id]
	}),
	subjectMetadata: one(subjectMetadatas, {
		fields: [subjects.subjectMetadataId],
		references: [subjectMetadatas.id]
	}),
}));

export const boardUniversitiesRelations = relations(boardUniversities, ({one, many}) => ({
	degree: one(degree, {
		fields: [boardUniversities.degreeId],
		references: [degree.id]
	}),
	address: one(address, {
		fields: [boardUniversities.addressId],
		references: [address.id]
	}),
	academicSubjects: many(academicSubjects),
	admissionAcademicInfos: many(admissionAcademicInfo),
	academicHistories: many(academicHistory),
}));

export const addressRelations = relations(address, ({one, many}) => ({
	boardUniversities: many(boardUniversities),
	institutions: many(institutions),
	country: one(countries, {
		fields: [address.countryId],
		references: [countries.id]
	}),
	state: one(states, {
		fields: [address.stateId],
		references: [states.id]
	}),
	city: one(cities, {
		fields: [address.cityId],
		references: [cities.id]
	}),
	accommodations: many(accommodation),
	people: many(person),
	personalDetails_mailingAddressId: many(personalDetails, {
		relationName: "personalDetails_mailingAddressId_address_id"
	}),
	personalDetails_residentialAddressId: many(personalDetails, {
		relationName: "personalDetails_residentialAddressId_address_id"
	}),
}));

export const academicSubjectsRelations = relations(academicSubjects, ({one, many}) => ({
	boardUniversity: one(boardUniversities, {
		fields: [academicSubjects.boardUniversityId],
		references: [boardUniversities.id]
	}),
	studentAcademicSubjects: many(studentAcademicSubjects),
}));

export const admissionsRelations = relations(admissions, ({one, many}) => ({
	applicationForms: many(applicationForms),
	admissionCourses: many(admissionCourses),
	academicYear: one(academicYears, {
		fields: [admissions.academicYearId],
		references: [academicYears.id]
	}),
}));

export const admissionAdditionalInfoRelations = relations(admissionAdditionalInfo, ({one, many}) => ({
	applicationForm: one(applicationForms, {
		fields: [admissionAdditionalInfo.applicationFormId],
		references: [applicationForms.id]
	}),
	bloodGroup: one(bloodGroup, {
		fields: [admissionAdditionalInfo.bloodGroupId],
		references: [bloodGroup.id]
	}),
	religion: one(religion, {
		fields: [admissionAdditionalInfo.religionId],
		references: [religion.id]
	}),
	category: one(categories, {
		fields: [admissionAdditionalInfo.categoryId],
		references: [categories.id]
	}),
	department: one(departments, {
		fields: [admissionAdditionalInfo.departmentOfStaffParentId],
		references: [departments.id]
	}),
	annualIncome: one(annualIncomes, {
		fields: [admissionAdditionalInfo.annualIncomeId],
		references: [annualIncomes.id]
	}),
	sportsInfos: many(sportsInfo),
}));

export const bloodGroupRelations = relations(bloodGroup, ({many}) => ({
	admissionAdditionalInfos: many(admissionAdditionalInfo),
	health: many(health),
}));

export const religionRelations = relations(religion, ({many}) => ({
	admissionAdditionalInfos: many(admissionAdditionalInfo),
	admissionGeneralInfos: many(admissionGeneralInfo),
	personalDetails: many(personalDetails),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	admissionAdditionalInfos: many(admissionAdditionalInfo),
	admissionGeneralInfos: many(admissionGeneralInfo),
	personalDetails: many(personalDetails),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	admissionAdditionalInfos: many(admissionAdditionalInfo),
}));

export const annualIncomesRelations = relations(annualIncomes, ({many}) => ({
	admissionAdditionalInfos: many(admissionAdditionalInfo),
	familyDetails: many(familyDetails),
}));

export const admissionAcademicInfoRelations = relations(admissionAcademicInfo, ({one, many}) => ({
	applicationForm: one(applicationForms, {
		fields: [admissionAcademicInfo.applicationFormId],
		references: [applicationForms.id]
	}),
	boardUniversity: one(boardUniversities, {
		fields: [admissionAcademicInfo.boardUniversityId],
		references: [boardUniversities.id]
	}),
	institution_instituteId: one(institutions, {
		fields: [admissionAcademicInfo.instituteId],
		references: [institutions.id],
		relationName: "admissionAcademicInfo_instituteId_institutions_id"
	}),
	languageMedium: one(languageMedium, {
		fields: [admissionAcademicInfo.languageMediumId],
		references: [languageMedium.id]
	}),
	course: one(courses, {
		fields: [admissionAcademicInfo.previouslyRegisteredCourseId],
		references: [courses.id]
	}),
	institution_previousCollegeId: one(institutions, {
		fields: [admissionAcademicInfo.previousCollegeId],
		references: [institutions.id],
		relationName: "admissionAcademicInfo_previousCollegeId_institutions_id"
	}),
	studentAcademicSubjects: many(studentAcademicSubjects),
}));

export const institutionsRelations = relations(institutions, ({one, many}) => ({
	admissionAcademicInfos_instituteId: many(admissionAcademicInfo, {
		relationName: "admissionAcademicInfo_instituteId_institutions_id"
	}),
	admissionAcademicInfos_previousCollegeId: many(admissionAcademicInfo, {
		relationName: "admissionAcademicInfo_previousCollegeId_institutions_id"
	}),
	degree: one(degree, {
		fields: [institutions.degreeId],
		references: [degree.id]
	}),
	address: one(address, {
		fields: [institutions.addressId],
		references: [address.id]
	}),
	academicHistories: many(academicHistory),
}));

export const languageMediumRelations = relations(languageMedium, ({many}) => ({
	admissionAcademicInfos: many(admissionAcademicInfo),
	personalDetails: many(personalDetails),
}));

export const admissionCourseApplicationsRelations = relations(admissionCourseApplications, ({one}) => ({
	applicationForm: one(applicationForms, {
		fields: [admissionCourseApplications.applicationFormId],
		references: [applicationForms.id]
	}),
	admissionCourse: one(admissionCourses, {
		fields: [admissionCourseApplications.admissionCourseId],
		references: [admissionCourses.id]
	}),
}));

export const admissionCoursesRelations = relations(admissionCourses, ({one, many}) => ({
	admissionCourseApplications: many(admissionCourseApplications),
	admission: one(admissions, {
		fields: [admissionCourses.admissionId],
		references: [admissions.id]
	}),
	course: one(courses, {
		fields: [admissionCourses.courseId],
		references: [courses.id]
	}),
}));

export const admissionGeneralInfoRelations = relations(admissionGeneralInfo, ({one}) => ({
	applicationForm: one(applicationForms, {
		fields: [admissionGeneralInfo.applicationFormId],
		references: [applicationForms.id]
	}),
	nationality: one(nationality, {
		fields: [admissionGeneralInfo.nationalityId],
		references: [nationality.id]
	}),
	category: one(categories, {
		fields: [admissionGeneralInfo.categoryId],
		references: [categories.id]
	}),
	religion: one(religion, {
		fields: [admissionGeneralInfo.religionId],
		references: [religion.id]
	}),
}));

export const nationalityRelations = relations(nationality, ({many}) => ({
	admissionGeneralInfos: many(admissionGeneralInfo),
	personalDetails_nationalityId: many(personalDetails, {
		relationName: "personalDetails_nationalityId_nationality_id"
	}),
	personalDetails_otherNationalityId: many(personalDetails, {
		relationName: "personalDetails_otherNationalityId_nationality_id"
	}),
}));

export const sportsInfoRelations = relations(sportsInfo, ({one}) => ({
	admissionAdditionalInfo: one(admissionAdditionalInfo, {
		fields: [sportsInfo.additionalInfoId],
		references: [admissionAdditionalInfo.id]
	}),
	sportsCategory: one(sportsCategories, {
		fields: [sportsInfo.sportsCategoryId],
		references: [sportsCategories.id]
	}),
}));

export const sportsCategoriesRelations = relations(sportsCategories, ({many}) => ({
	sportsInfos: many(sportsInfo),
}));

export const studentAcademicSubjectsRelations = relations(studentAcademicSubjects, ({one}) => ({
	admissionAcademicInfo: one(admissionAcademicInfo, {
		fields: [studentAcademicSubjects.admissionAcademicInfoId],
		references: [admissionAcademicInfo.id]
	}),
	academicSubject: one(academicSubjects, {
		fields: [studentAcademicSubjects.academicSubjectId],
		references: [academicSubjects.id]
	}),
}));

export const feesStructuresRelations = relations(feesStructures, ({one, many}) => ({
	feesReceiptType: one(feesReceiptTypes, {
		fields: [feesStructures.feesReceiptTypeId],
		references: [feesReceiptTypes.id]
	}),
	academicYear: one(academicYears, {
		fields: [feesStructures.academicYearId],
		references: [academicYears.id]
	}),
	course_courseId: one(courses, {
		fields: [feesStructures.courseId],
		references: [courses.id],
		relationName: "feesStructures_courseId_courses_id"
	}),
	class: one(classes, {
		fields: [feesStructures.classId],
		references: [classes.id]
	}),
	shift: one(shifts, {
		fields: [feesStructures.shiftId],
		references: [shifts.id]
	}),
	course_advanceForCourseId: one(courses, {
		fields: [feesStructures.advanceForCourseId],
		references: [courses.id],
		relationName: "feesStructures_advanceForCourseId_courses_id"
	}),
	feesComponents: many(feesComponents),
	feesSlabMappings: many(feesSlabMapping),
	instalments: many(instalments),
	studentFeesMappings: many(studentFeesMappings),
}));

export const feesReceiptTypesRelations = relations(feesReceiptTypes, ({one, many}) => ({
	feesStructures: many(feesStructures),
	addon: one(addons, {
		fields: [feesReceiptTypes.addOnId],
		references: [addons.id]
	}),
}));

export const feesComponentsRelations = relations(feesComponents, ({one}) => ({
	feesStructure: one(feesStructures, {
		fields: [feesComponents.feesStructureId],
		references: [feesStructures.id]
	}),
	feesHead: one(feesHeads, {
		fields: [feesComponents.feesHeadId],
		references: [feesHeads.id]
	}),
}));

export const feesHeadsRelations = relations(feesHeads, ({many}) => ({
	feesComponents: many(feesComponents),
}));

export const addonsRelations = relations(addons, ({many}) => ({
	feesReceiptTypes: many(feesReceiptTypes),
}));

export const feesSlabMappingRelations = relations(feesSlabMapping, ({one}) => ({
	feesStructure: one(feesStructures, {
		fields: [feesSlabMapping.feesStructureId],
		references: [feesStructures.id]
	}),
	feesSlab: one(feesSlab, {
		fields: [feesSlabMapping.feesSlabId],
		references: [feesSlab.id]
	}),
}));

export const feesSlabRelations = relations(feesSlab, ({many}) => ({
	feesSlabMappings: many(feesSlabMapping),
}));

export const instalmentsRelations = relations(instalments, ({one, many}) => ({
	feesStructure: one(feesStructures, {
		fields: [instalments.feesStructureId],
		references: [feesStructures.id]
	}),
	studentFeesMappings: many(studentFeesMappings),
}));

export const studentFeesMappingsRelations = relations(studentFeesMappings, ({one}) => ({
	student: one(students, {
		fields: [studentFeesMappings.studentId],
		references: [students.id]
	}),
	feesStructure: one(feesStructures, {
		fields: [studentFeesMappings.feesStructureId],
		references: [feesStructures.id]
	}),
	instalment: one(instalments, {
		fields: [studentFeesMappings.instalmentId],
		references: [instalments.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	applicationForm: one(applicationForms, {
		fields: [payments.applicationFormId],
		references: [applicationForms.id]
	}),
}));

export const countriesRelations = relations(countries, ({many}) => ({
	addresses: many(address),
	states: many(states),
}));

export const statesRelations = relations(states, ({one, many}) => ({
	addresses: many(address),
	country: one(countries, {
		fields: [states.countryId],
		references: [countries.id]
	}),
	cities: many(cities),
}));

export const citiesRelations = relations(cities, ({one, many}) => ({
	addresses: many(address),
	state: one(states, {
		fields: [cities.stateId],
		references: [states.id]
	}),
}));

export const academicHistoryRelations = relations(academicHistory, ({one}) => ({
	student: one(students, {
		fields: [academicHistory.studentId],
		references: [students.id]
	}),
	institution: one(institutions, {
		fields: [academicHistory.lastInstitutionId],
		references: [institutions.id]
	}),
	boardUniversity: one(boardUniversities, {
		fields: [academicHistory.lastBoardUniversityId],
		references: [boardUniversities.id]
	}),
	specialization: one(specializations, {
		fields: [academicHistory.specializationId],
		references: [specializations.id]
	}),
	boardResultStatus: one(boardResultStatus, {
		fields: [academicHistory.lastResultId],
		references: [boardResultStatus.id]
	}),
}));

export const boardResultStatusRelations = relations(boardResultStatus, ({many}) => ({
	academicHistories: many(academicHistory),
}));

export const academicIdentifiersRelations = relations(academicIdentifiers, ({one}) => ({
	student: one(students, {
		fields: [academicIdentifiers.studentId],
		references: [students.id]
	}),
	course: one(courses, {
		fields: [academicIdentifiers.courseId],
		references: [courses.id]
	}),
	shift: one(shifts, {
		fields: [academicIdentifiers.shiftId],
		references: [shifts.id]
	}),
	section: one(sections, {
		fields: [academicIdentifiers.sectionId],
		references: [sections.id]
	}),
}));

export const accommodationRelations = relations(accommodation, ({one}) => ({
	student: one(students, {
		fields: [accommodation.studentId],
		references: [students.id]
	}),
	address: one(address, {
		fields: [accommodation.addressId],
		references: [address.id]
	}),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({one}) => ({
	student: one(students, {
		fields: [emergencyContacts.studentId],
		references: [students.id]
	}),
}));

export const familyDetailsRelations = relations(familyDetails, ({one}) => ({
	student: one(students, {
		fields: [familyDetails.studentId],
		references: [students.id]
	}),
	person_fatherDetailsPersonId: one(person, {
		fields: [familyDetails.fatherDetailsPersonId],
		references: [person.id],
		relationName: "familyDetails_fatherDetailsPersonId_person_id"
	}),
	person_motherDetailsPersonId: one(person, {
		fields: [familyDetails.motherDetailsPersonId],
		references: [person.id],
		relationName: "familyDetails_motherDetailsPersonId_person_id"
	}),
	person_guardianDetailsPersonId: one(person, {
		fields: [familyDetails.guardianDetailsPersonId],
		references: [person.id],
		relationName: "familyDetails_guardianDetailsPersonId_person_id"
	}),
	annualIncome: one(annualIncomes, {
		fields: [familyDetails.annualIncomeId],
		references: [annualIncomes.id]
	}),
}));

export const personRelations = relations(person, ({one, many}) => ({
	familyDetails_fatherDetailsPersonId: many(familyDetails, {
		relationName: "familyDetails_fatherDetailsPersonId_person_id"
	}),
	familyDetails_motherDetailsPersonId: many(familyDetails, {
		relationName: "familyDetails_motherDetailsPersonId_person_id"
	}),
	familyDetails_guardianDetailsPersonId: many(familyDetails, {
		relationName: "familyDetails_guardianDetailsPersonId_person_id"
	}),
	qualification: one(qualifications, {
		fields: [person.qualificationId],
		references: [qualifications.id]
	}),
	occupation: one(occupations, {
		fields: [person.occupationId],
		references: [occupations.id]
	}),
	address: one(address, {
		fields: [person.officeAddresId],
		references: [address.id]
	}),
}));

export const qualificationsRelations = relations(qualifications, ({many}) => ({
	people: many(person),
}));

export const occupationsRelations = relations(occupations, ({many}) => ({
	people: many(person),
}));

export const healthRelations = relations(health, ({one}) => ({
	student: one(students, {
		fields: [health.studentId],
		references: [students.id]
	}),
	bloodGroup: one(bloodGroup, {
		fields: [health.bloodGroupId],
		references: [bloodGroup.id]
	}),
}));

export const personalDetailsRelations = relations(personalDetails, ({one}) => ({
	student: one(students, {
		fields: [personalDetails.studentId],
		references: [students.id]
	}),
	nationality_nationalityId: one(nationality, {
		fields: [personalDetails.nationalityId],
		references: [nationality.id],
		relationName: "personalDetails_nationalityId_nationality_id"
	}),
	nationality_otherNationalityId: one(nationality, {
		fields: [personalDetails.otherNationalityId],
		references: [nationality.id],
		relationName: "personalDetails_otherNationalityId_nationality_id"
	}),
	religion: one(religion, {
		fields: [personalDetails.religionId],
		references: [religion.id]
	}),
	category: one(categories, {
		fields: [personalDetails.categoryId],
		references: [categories.id]
	}),
	languageMedium: one(languageMedium, {
		fields: [personalDetails.motherTongueLanguageMediumId],
		references: [languageMedium.id]
	}),
	address_mailingAddressId: one(address, {
		fields: [personalDetails.mailingAddressId],
		references: [address.id],
		relationName: "personalDetails_mailingAddressId_address_id"
	}),
	address_residentialAddressId: one(address, {
		fields: [personalDetails.residentialAddressId],
		references: [address.id],
		relationName: "personalDetails_residentialAddressId_address_id"
	}),
	disabilityCode: one(disabilityCodes, {
		fields: [personalDetails.disablityCodeId],
		references: [disabilityCodes.id]
	}),
}));

export const disabilityCodesRelations = relations(disabilityCodes, ({many}) => ({
	personalDetails: many(personalDetails),
}));

export const transportDetailsRelations = relations(transportDetails, ({one}) => ({
	student: one(students, {
		fields: [transportDetails.studentId],
		references: [students.id]
	}),
	transport: one(transport, {
		fields: [transportDetails.transportId],
		references: [transport.id]
	}),
	pickupPoint: one(pickupPoint, {
		fields: [transportDetails.pickupPointId],
		references: [pickupPoint.id]
	}),
}));

export const transportRelations = relations(transport, ({many}) => ({
	transportDetails: many(transportDetails),
}));

export const pickupPointRelations = relations(pickupPoint, ({many}) => ({
	transportDetails: many(transportDetails),
}));