import { and, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import {
  classModel,
  sectionModel,
  shiftModel,
} from "@repo/db/schemas/models/academics";
import { admissionAcademicInfoModel } from "@repo/db/schemas/models/admissions/admission-academic-info.model.js";
import { tempAdmitCardDistributionsModel } from "@repo/db/schemas/models/exams/index.js";
import type { AdmitCardSearchResponse } from "@/types/exams/admit-card.type.js";

export async function searchCandidate(
  examGroupId: number | undefined,
  searchTerm: string,
): Promise<AdmitCardSearchResponse | null> {
  const term = `%${searchTerm}%`;

  const distributedByUser = alias(userModel, "distributed_by_user");

  const rows = await db
    .select({
      studentId: studentModel.id,
      studentUid: studentModel.uid,
      studentRollNumber: studentModel.rollNumber,
      promotionRollNumber: promotionModel.rollNumber,
      promotionClassRollNumber: promotionModel.classRollNumber,
      studentRegistrationNumber: studentModel.registrationNumber,
      admissionRegistrationNumber:
        admissionAcademicInfoModel.registrationNumber,
      admissionCuRegistrationNumber:
        admissionAcademicInfoModel.cuRegistrationNumber,
      studentRfid: studentModel.rfidNumber,
      userName: userModel.name,
      userIsActive: userModel.isActive,
      programCourseName: programCourseModel.name,
      semesterName: classModel.name,
      shiftName: shiftModel.name,
      sectionName: sectionModel.name,
      distributionCreatedAt: tempAdmitCardDistributionsModel.createdAt,
      distributedByUserName: distributedByUser.name,
      distributedByUserImage: distributedByUser.image,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(sectionModel, eq(sectionModel.id, promotionModel.sectionId))
    .leftJoin(
      tempAdmitCardDistributionsModel,
      eq(tempAdmitCardDistributionsModel.studentId, studentModel.id),
    )
    .leftJoin(
      distributedByUser,
      eq(
        distributedByUser.id,
        tempAdmitCardDistributionsModel.distributedByUserId,
      ),
    )
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.studentId, studentModel.id),
    )
    .where(
      and(
        or(
          ilike(studentModel.rollNumber, term),
          ilike(studentModel.registrationNumber, term),
          ilike(studentModel.rfidNumber, term),
          ilike(studentModel.uid, term),
          ilike(promotionModel.rollNumber, term),
          ilike(promotionModel.classRollNumber, term),
          ilike(admissionAcademicInfoModel.registrationNumber, term),
          ilike(admissionAcademicInfoModel.cuRegistrationNumber, term),
        ),
      ),
    );

  if (!rows.length) {
    return null;
  }

  const first = rows[0];

  const rollNumber =
    first.promotionRollNumber ??
    first.studentRollNumber ??
    first.promotionClassRollNumber ??
    null;

  const registrationNumber =
    first.studentRegistrationNumber ??
    first.admissionRegistrationNumber ??
    first.admissionCuRegistrationNumber ??
    null;

  const collectionDate = first.distributionCreatedAt
    ? first.distributionCreatedAt.toISOString()
    : null;

  return {
    candidate: {
      id: first.studentId,
      examId: 0,
      studentId: first.studentId,
      name: first.userName,
      uid: first.studentUid,
      rollNumber,
      registrationNumber,
      rfid: first.studentRfid,
      programCourse: first.programCourseName ?? null,
      semester: first.semesterName ?? null,
      shift: first.shiftName ?? null,
      section: first.sectionName ?? null,
      examName: null,
    },
    papers: [],
    alreadyDistributed: !!first.distributionCreatedAt,
    isUserInactive: !first.userIsActive,
    collectionDate,
    distributedByName: first.distributedByUserName ?? null,
    distributedByUserImage: first.distributedByUserImage ?? null,
    venueOfExamination: null,
    roomName: null,
    seatNumber: null,
  };
}

export async function distributeAdmitCard(
  studentId: number,
  distributedByUserId: number,
) {
  const [inserted] = await db
    .insert(tempAdmitCardDistributionsModel)
    .values({
      studentId,
      distributedByUserId: distributedByUserId,
    })
    .returning({
      id: tempAdmitCardDistributionsModel.id,
      createdAt: tempAdmitCardDistributionsModel.createdAt,
    });

  return inserted;
}

export async function listAdmitCardDistributions(examGroupId?: number): Promise<
  Array<{
    studentId: number;
    studentName: string;
    uid: string;
    rollNumber: string | null;
    registrationNumber: string | null;
    programCourse: string | null;
    semester: string | null;
    shift: string | null;
    appearType: string | null;
    collectionDate: string;
    savedByName: string | null;
  }>
> {
  const distributedByUser = alias(userModel, "distribution_user");

  const rows = await db
    .select({
      studentId: studentModel.id,
      studentName: userModel.name,
      uid: studentModel.uid,
      studentRollNumber: studentModel.rollNumber,
      promotionRollNumber: promotionModel.rollNumber,
      promotionClassRollNumber: promotionModel.classRollNumber,
      studentRegistrationNumber: studentModel.registrationNumber,
      admissionRegistrationNumber:
        admissionAcademicInfoModel.registrationNumber,
      admissionCuRegistrationNumber:
        admissionAcademicInfoModel.cuRegistrationNumber,
      programCourse: programCourseModel.name,
      semester: classModel.name,
      shift: shiftModel.name,
      collectionDate: tempAdmitCardDistributionsModel.createdAt,
      savedByName: distributedByUser.name,
    })
    .from(tempAdmitCardDistributionsModel)
    .innerJoin(
      studentModel,
      eq(studentModel.id, tempAdmitCardDistributionsModel.studentId),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.studentId, studentModel.id),
    )
    .leftJoin(
      distributedByUser,
      eq(
        distributedByUser.id,
        tempAdmitCardDistributionsModel.distributedByUserId,
      ),
    )
    .orderBy(desc(tempAdmitCardDistributionsModel.createdAt));

  return rows.map((row) => {
    const rollNumber =
      row.promotionRollNumber ??
      row.studentRollNumber ??
      row.promotionClassRollNumber ??
      null;

    const registrationNumber =
      row.studentRegistrationNumber ??
      row.admissionRegistrationNumber ??
      row.admissionCuRegistrationNumber ??
      null;

    return {
      studentId: row.studentId,
      studentName: row.studentName,
      uid: row.uid,
      rollNumber,
      registrationNumber,
      programCourse: row.programCourse,
      semester: row.semester,
      shift: row.shift,
      appearType: "REGULAR",
      collectionDate: row.collectionDate?.toISOString() ?? "",
      savedByName: row.savedByName ?? null,
    };
  });
}
