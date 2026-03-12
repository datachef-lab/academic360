import { and, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { examCandidateModel } from "@repo/db/schemas/models/exams/exam-candidate.model.js";
import { examGroupModel } from "@repo/db/schemas/models/exams/exam-group.model.js";
import { examModel } from "@repo/db/schemas/models/exams/exam.model.js";
import { examRoomModel } from "@repo/db/schemas/models/exams/exam-room.model.js";
import { floorModel } from "@repo/db/schemas/models/exams/floor.model.js";
import { roomModel } from "@repo/db/schemas/models/exams/room.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { paperModel } from "@repo/db/schemas/models/course-design/paper.model.js";
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
  // For now, we search based on student identifiers present on student/user.
  // Adjust joins/columns if roll/registration/rfid are stored elsewhere.

  const term = `%${searchTerm}%`;

  const distributedByUser = alias(userModel, "distributed_by_user");

  const rows = await db
    .select({
      examCandidateId: examCandidateModel.id,
      examId: examCandidateModel.examId,
      examName: examGroupModel.name,
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
      programCourseName: programCourseModel.name,
      semester: classModel.name,
      shiftName: shiftModel.name,
      sectionName: sectionModel.name,
      userName: userModel.name,
      userIsActive: userModel.isActive,
      paperCode: paperModel.code,
      paperName: paperModel.name,
      seatNumber: examCandidateModel.seatNumber,
      roomName: roomModel.name,
      venueName: floorModel.name,
      distributionCreatedAt: tempAdmitCardDistributionsModel.createdAt,
      distributionId: tempAdmitCardDistributionsModel.id,
      distributedByUserName: distributedByUser.name,
      distributedByUserImage: distributedByUser.image,
    })
    .from(examCandidateModel)
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .innerJoin(examGroupModel, eq(examGroupModel.id, examModel.examGroupId))
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(sectionModel, eq(sectionModel.id, promotionModel.sectionId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.studentId, studentModel.id),
    )
    .innerJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
    .leftJoin(
      examRoomModel,
      eq(examRoomModel.id, examCandidateModel.examRoomId),
    )
    .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
    .leftJoin(floorModel, eq(floorModel.id, roomModel.floorId))
    .leftJoin(
      tempAdmitCardDistributionsModel,
      eq(
        tempAdmitCardDistributionsModel.examCandidateId,
        examCandidateModel.id,
      ),
    )
    .leftJoin(
      distributedByUser,
      eq(
        distributedByUser.id,
        tempAdmitCardDistributionsModel.distributedByUserId,
      ),
    )
    .where(
      and(
        examGroupId ? eq(examGroupModel.id, examGroupId) : undefined,
        or(
          ilike(studentModel.rollNumber, term),
          ilike(studentModel.registrationNumber, term),
          ilike(studentModel.rfidNumber, term),
          ilike(studentModel.uid, term),
        ),
      ),
    );

  if (!rows.length) {
    return null;
  }

  // Prefer a row that has seat/room information, so Venue of Examination populates when available
  const first =
    rows.find(
      (r) => r.seatNumber != null || r.roomName != null || r.venueName != null,
    ) ?? rows[0];

  const papers = rows.map((r) => ({
    paperCode: r.paperCode,
    paperName: r.paperName,
  }));

  const alreadyDistributed = !!first.distributionId;
  const collectionDate = first.distributionCreatedAt
    ? first.distributionCreatedAt.toISOString()
    : null;
  const distributedByName = first.distributedByUserName ?? null;
  const distributedByUserImage = first.distributedByUserImage ?? null;
  const venueOfExamination = first.venueName ?? null;
  const roomName = first.roomName ?? null;
  const seatNumber = first.seatNumber ?? null;

  return {
    candidate: {
      id: first.examCandidateId,
      examId: first.examId,
      studentId: first.studentId,
      name: first.userName,
      uid: first.studentUid,
      rollNumber:
        first.promotionRollNumber ??
        first.studentRollNumber ??
        first.promotionClassRollNumber ??
        null,
      registrationNumber:
        first.studentRegistrationNumber ??
        first.admissionRegistrationNumber ??
        first.admissionCuRegistrationNumber ??
        null,
      rfid: first.studentRfid,
      programCourse: first.programCourseName ?? null,
      semester: first.semester ?? null,
      shift: first.shiftName ?? null,
      section: first.sectionName ?? null,
      examName: first.examName ?? null,
    },
    papers,
    alreadyDistributed,
    isUserInactive: !first.userIsActive,
    collectionDate,
    distributedByName,
    distributedByUserImage,
    venueOfExamination,
    roomName,
    seatNumber,
  };
}

export async function distributeAdmitCard(
  examCandidateId: number,
  distributedByUserId: number,
) {
  // First, load exam + student context for this exam candidate
  const [context] = await db
    .select({
      examId: examCandidateModel.examId,
      examGroupId: examModel.examGroupId,
      studentId: promotionModel.studentId,
    })
    .from(examCandidateModel)
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .where(eq(examCandidateModel.id, examCandidateId))
    .limit(1);

  if (!context) {
    throw new Error("Exam candidate not found.");
  }

  const { examGroupId, studentId } = context;

  if (examGroupId == null) {
    throw new Error("Exam group not found for this exam candidate.");
  }

  // Strict duplicate prevention:
  // 1) Same exam_candidate_id
  // 2) Any exam_candidate for the same student in the same exam group
  const existing = await db
    .select({
      id: tempAdmitCardDistributionsModel.id,
    })
    .from(tempAdmitCardDistributionsModel)
    .innerJoin(
      examCandidateModel,
      eq(
        examCandidateModel.id,
        tempAdmitCardDistributionsModel.examCandidateId,
      ),
    )
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .where(
      and(
        eq(examModel.examGroupId, examGroupId as number),
        eq(promotionModel.studentId, studentId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(
      "Admit card already marked as distributed for this student in this exam group.",
    );
  }

  const [inserted] = await db
    .insert(tempAdmitCardDistributionsModel)
    .values({
      examCandidateId: examCandidateId,
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
    examCandidateId: number;
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
      examCandidateId: examCandidateModel.id,
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
      examCandidateModel,
      eq(
        examCandidateModel.id,
        tempAdmitCardDistributionsModel.examCandidateId,
      ),
    )
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .innerJoin(examGroupModel, eq(examGroupModel.id, examModel.examGroupId))
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
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
    .where(examGroupId ? eq(examGroupModel.id, examGroupId) : undefined)
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
      examCandidateId: row.examCandidateId,
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
