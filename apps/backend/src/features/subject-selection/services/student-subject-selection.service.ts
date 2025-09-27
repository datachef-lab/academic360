import { db } from "@/db/index.js";
import { and, countDistinct, desc, eq } from "drizzle-orm";
import { studentSubjectSelectionModel } from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
import { sessionModel } from "@repo/db/schemas/models/academics";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaStreamModel,
  subjectSelectionMetaClassModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  subjectModel,
  streamModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { academicYearModel } from "@repo/db/schemas/models/academics";
import { classModel } from "@repo/db/schemas/models/academics/class.model";
import {
  StudentSubjectSelection,
  StudentSubjectSelectionT,
} from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
import {
  SubjectSelectionMetaDto,
  StudentSubjectSelectionDto,
} from "@repo/db/dtos/subject-selection/index";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

export type CreateStudentSubjectSelectionDtoInput = {
  studentId: number;
  session: { id: number };
  subjectSelectionMeta: { id: number };
  subject: { id: number };
};

export type UpdateStudentSubjectSelectionDtoInput =
  Partial<CreateStudentSubjectSelectionDtoInput>;

// -- Helpers -----------------------------------------------------------------

async function modelToDto(
  row: StudentSubjectSelectionT,
): Promise<StudentSubjectSelectionDto> {
  // Fetch the joined entities for full DTO
  const [[session], [meta], [subject]] = await Promise.all([
    db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, row.sessionId as number)),
    db
      .select()
      .from(subjectSelectionMetaModel)
      .where(
        eq(subjectSelectionMetaModel.id, row.subjectSelectionMetaId as number),
      ),
    db
      .select()
      .from(subjectModel)
      .where(eq(subjectModel.id, row.subjectId as number)),
  ]);

  if (!session)
    throw new Error("Session not found for StudentSubjectSelection");
  if (!meta)
    throw new Error(
      "SubjectSelectionMeta not found for StudentSubjectSelection",
    );
  if (!subject)
    throw new Error("Subject not found for StudentSubjectSelection");

  // Fetch related data for SubjectSelectionMetaDto
  const [academicYear, subjectType, streams, forClasses] = await Promise.all([
    db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, meta.academicYearId)),
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, meta.subjectTypeId)),
    // Fetch streams through the many-to-many relationship
    db
      .select({
        id: subjectSelectionMetaStreamModel.id,
        createdAt: subjectSelectionMetaStreamModel.createdAt,
        updatedAt: subjectSelectionMetaStreamModel.updatedAt,
        stream: {
          id: streamModel.id,
          name: streamModel.name,
          code: streamModel.code,
          shortName: streamModel.shortName,
          isActive: streamModel.isActive,
          createdAt: streamModel.createdAt,
          updatedAt: streamModel.updatedAt,
        },
      })
      .from(subjectSelectionMetaStreamModel)
      .leftJoin(
        streamModel,
        eq(subjectSelectionMetaStreamModel.streamId, streamModel.id),
      )
      .where(
        eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, meta.id),
      ),
    // Fetch classes through the many-to-many relationship
    db
      .select({
        id: subjectSelectionMetaClassModel.id,
        subjectSelectionMetaId:
          subjectSelectionMetaClassModel.subjectSelectionMetaId,
        createdAt: subjectSelectionMetaClassModel.createdAt,
        updatedAt: subjectSelectionMetaClassModel.updatedAt,
        class: {
          id: classModel.id,
          name: classModel.name,
          type: classModel.type,
          isActive: classModel.isActive,
          createdAt: classModel.createdAt,
          updatedAt: classModel.updatedAt,
        },
      })
      .from(subjectSelectionMetaClassModel)
      .leftJoin(
        classModel,
        eq(subjectSelectionMetaClassModel.classId, classModel.id),
      )
      .where(
        eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
      ),
  ]);

  const subjectSelectionMeta: SubjectSelectionMetaDto = {
    id: meta.id!,
    academicYear: academicYear[0]!,
    subjectType: subjectType[0]!,
    streams: streams.map((s) => ({
      id: s.id!,
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
      stream: s.stream!,
    })),
    forClasses: forClasses.map((c) => ({
      id: c.id!,
      subjectSelectionMetaId: c.subjectSelectionMetaId!,
      createdAt: c.createdAt || new Date(),
      updatedAt: c.updatedAt || new Date(),
      class: c.class!,
    })),
    label: meta.label,
    createdAt: meta.createdAt || new Date(),
    updatedAt: meta.updatedAt || new Date(),
  } as unknown as SubjectSelectionMetaDto;

  const dto: StudentSubjectSelectionDto = {
    id: row.id as number,
    studentId: row.studentId as number,
    session,
    subjectSelectionMeta,
    subject,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
  return dto;
}

// -- CRUD --------------------------------------------------------------------

export async function createStudentSubjectSelection(
  data: StudentSubjectSelection,
): Promise<StudentSubjectSelectionDto> {
  const [created] = await db
    .insert(studentSubjectSelectionModel)
    .values(data)
    .returning();
  return (await getStudentSubjectSelectionById(
    created.id as number,
  )) as StudentSubjectSelectionDto;
}

export async function createStudentSubjectSelectionFromDto(
  input: CreateStudentSubjectSelectionDtoInput,
): Promise<StudentSubjectSelectionDto> {
  const base: StudentSubjectSelection = {
    studentId: input.studentId,
    sessionId: input.session.id,
    subjectSelectionMetaId: input.subjectSelectionMeta.id,
    subjectId: input.subject.id,
  } as StudentSubjectSelection;
  const [created] = await db
    .insert(studentSubjectSelectionModel)
    .values(base)
    .returning();
  return (await getStudentSubjectSelectionById(
    created.id as number,
  )) as StudentSubjectSelectionDto;
}

export async function getStudentSubjectSelectionById(
  id: number,
): Promise<StudentSubjectSelectionDto | null> {
  const [row] = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(eq(studentSubjectSelectionModel.id, id));
  if (!row) return null;
  return await modelToDto(row as StudentSubjectSelectionT);
}

export async function getStudentSubjectSelectionsPaginated(options: {
  page: number;
  pageSize: number;
  studentId?: number;
  sessionId?: number;
}): Promise<PaginatedResponse<StudentSubjectSelectionDto>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const whereExpr =
    options.studentId && options.sessionId
      ? and(
          eq(studentSubjectSelectionModel.studentId, options.studentId),
          eq(studentSubjectSelectionModel.sessionId, options.sessionId),
        )
      : options.studentId
        ? eq(studentSubjectSelectionModel.studentId, options.studentId)
        : options.sessionId
          ? eq(studentSubjectSelectionModel.sessionId, options.sessionId)
          : undefined;

  const rows = await db
    .select()
    .from(studentSubjectSelectionModel)
    .where(whereExpr)
    .orderBy(desc(studentSubjectSelectionModel.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: countDistinct(studentSubjectSelectionModel.id) })
    .from(studentSubjectSelectionModel)
    .where(whereExpr);

  const content = await Promise.all(
    rows.map((r) => modelToDto(r as StudentSubjectSelectionT)),
  );
  const totalElements = Number(count || 0);
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  return { content, page, pageSize, totalPages, totalElements };
}

export async function updateStudentSubjectSelection(
  id: number,
  data: Partial<StudentSubjectSelection>,
): Promise<StudentSubjectSelectionDto> {
  const [updated] = await db
    .update(studentSubjectSelectionModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(studentSubjectSelectionModel.id, id))
    .returning();
  const dto = await getStudentSubjectSelectionById(updated.id as number);
  if (!dto)
    throw new Error("Failed to retrieve updated StudentSubjectSelection");
  return dto;
}

export async function updateStudentSubjectSelectionFromDto(
  id: number,
  input: UpdateStudentSubjectSelectionDtoInput,
): Promise<StudentSubjectSelectionDto> {
  const partial: Partial<StudentSubjectSelection> = {};
  if (typeof input.studentId === "number") partial.studentId = input.studentId;
  if (input.session?.id) partial.sessionId = input.session.id;
  if (input.subjectSelectionMeta?.id)
    partial.subjectSelectionMetaId = input.subjectSelectionMeta.id;
  if (input.subject?.id) partial.subjectId = input.subject.id;
  return await updateStudentSubjectSelection(id, partial);
}

export async function deleteStudentSubjectSelection(id: number) {
  const [deleted] = await db
    .delete(studentSubjectSelectionModel)
    .where(eq(studentSubjectSelectionModel.id, id))
    .returning();
  return deleted;
}
