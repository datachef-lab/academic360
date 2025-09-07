import { db } from "@/db";
import { AdmissionCourseDetailsDto } from "@repo/db/dtos/admissions";
import { ProgramCourseDto } from "@repo/db/dtos/course-design";
import {
  AdmissionCourseDetails,
  admissionCourseDetailsModel,
  Affiliation,
  affiliationModel,
  Class,
  classModel,
  Course,
  courseModel,
  CourseLevel,
  courseLevelModel,
  CourseType,
  courseTypeModel,
  EligibilityCriteria,
  eligibilityCriteriaModel,
  ProgramCourse,
  programCourseModel,
  RegulationType,
  regulationTypeModel,
  Shift,
  shiftModel,
  Stream,
  streamModel,
  StudentCategory,
  studentCategoryModel,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export async function findAdmCourseDetailsByStudentId(
  studentId: number,
): Promise<AdmissionCourseDetailsDto | null> {
  const [foundAdmCourseDetails] = await db
    .select()
    .from(admissionCourseDetailsModel)
    .where(eq(admissionCourseDetailsModel.applicationFormId, 0));

  if (!foundAdmCourseDetails) {
    return null;
  }

  return await modelToDto(foundAdmCourseDetails);
}

async function modelToDto(
  model: AdmissionCourseDetails,
): Promise<AdmissionCourseDetailsDto> {
  const {
    streamId,
    classId,
    shiftId,
    eligibilityCriteriaId,
    studentCategoryId,
    ...rest
  } = model;

  const formattedAdmCourseDetails: AdmissionCourseDetailsDto = {
    ...rest,
    programCourse: null,

    stream: streamId ? await findStreamById(streamId) : null,
    // programCourse: programCourseId ? await findProgramCourseById(programCourseId) : null,
    class: classId ? await findClassById(classId) : null,
    shift: shiftId ? await findShiftById(shiftId) : null,
    eligibilityCriteria: eligibilityCriteriaId
      ? await findEligibilityCriteriaById(eligibilityCriteriaId)
      : null,
    studentCategory: studentCategoryId
      ? await findStudentCategoryById(studentCategoryId)
      : null,
  };

  return formattedAdmCourseDetails;
}

// Helper functions to find related entities
async function findStreamById(id: number): Promise<Stream | null> {
  if (!id) return null;
  const [stream] = await db
    .select()
    .from(streamModel)
    .where(eq(streamModel.id, id));
  return stream || null;
}

async function findProgramCourseById(
  id: number,
): Promise<ProgramCourseDto | null> {
  if (!id) return null;
  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, id));
  return programCourse
    ? await programCourseResponseFormat(programCourse)
    : null;
}

async function programCourseResponseFormat(
  programCourse: ProgramCourse,
): Promise<ProgramCourseDto> {
  const {
    courseId,
    courseTypeId,
    courseLevelId,
    affiliationId,
    regulationTypeId,
    streamId,
    ...rest
  } = programCourse;
  return {
    ...rest,
    stream: streamId ? await findStreamById(streamId) : null,
    course: courseId ? await findCourseById(courseId) : null,
    courseType: courseTypeId ? await findCourseTypeById(courseTypeId) : null,
    courseLevel: courseLevelId
      ? await findCourseLevelById(courseLevelId)
      : null,
    affiliation: affiliationId
      ? await findAffiliationById(affiliationId)
      : null,
    regulationType: regulationTypeId
      ? await findRegulationTypeById(regulationTypeId)
      : null,
  };
}

async function findClassById(id: number): Promise<Class | null> {
  if (!id) return null;
  const [classData] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, id));
  return classData || null;
}

async function findShiftById(id: number): Promise<Shift | null> {
  if (!id) return null;
  const [shift] = await db
    .select()
    .from(shiftModel)
    .where(eq(shiftModel.id, id));
  return shift || null;
}

async function findEligibilityCriteriaById(
  id: number,
): Promise<EligibilityCriteria | null> {
  if (!id) return null;
  const [eligibilityCriteria] = await db
    .select()
    .from(eligibilityCriteriaModel)
    .where(eq(eligibilityCriteriaModel.id, id));
  return eligibilityCriteria || null;
}

async function findStudentCategoryById(
  id: number,
): Promise<StudentCategory | null> {
  if (!id) return null;
  const [studentCategory] = await db
    .select()
    .from(studentCategoryModel)
    .where(eq(studentCategoryModel.id, id));
  return studentCategory || null;
}

// Additional helper functions for ProgramCourseDto
async function findCourseById(id: number): Promise<Course | null> {
  if (!id) return null;
  const [course] = await db
    .select()
    .from(courseModel)
    .where(eq(courseModel.id, id));
  return course || null;
}

async function findCourseTypeById(id: number): Promise<CourseType | null> {
  if (!id) return null;
  const [courseType] = await db
    .select()
    .from(courseTypeModel)
    .where(eq(courseTypeModel.id, id));
  return courseType || null;
}

async function findCourseLevelById(id: number): Promise<CourseLevel | null> {
  if (!id) return null;
  const [courseLevel] = await db
    .select()
    .from(courseLevelModel)
    .where(eq(courseLevelModel.id, id));
  return courseLevel || null;
}

async function findAffiliationById(id: number): Promise<Affiliation | null> {
  if (!id) return null;
  const [affiliation] = await db
    .select()
    .from(affiliationModel)
    .where(eq(affiliationModel.id, id));
  return affiliation || null;
}

async function findRegulationTypeById(
  id: number,
): Promise<RegulationType | null> {
  if (!id) return null;
  const [regulationType] = await db
    .select()
    .from(regulationTypeModel)
    .where(eq(regulationTypeModel.id, id));
  return regulationType || null;
}
