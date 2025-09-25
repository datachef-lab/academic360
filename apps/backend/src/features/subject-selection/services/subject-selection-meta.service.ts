import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  streamModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { classModel } from "@repo/db/schemas/models/academics";
import {
  SubjectSelectionMetaDto,
  SubjectSelectionMetaClassDto,
} from "@repo/db/dtos/subject-selection";

// Use DTOs only for service I/O types per requirement

export interface CreateSubjectSelectionMetaInput {
  label: string;
  stream: { id: number };
  subjectType: { id: number };
  forClasses?: { id: number }[];
}

type SubjectSelectionMetaRow = typeof subjectSelectionMetaModel.$inferSelect;
type SubjectSelectionMetaClassRow =
  typeof subjectSelectionMetaClassModel.$inferSelect;
type ClassRow = typeof classModel.$inferSelect;
type StreamRow = typeof streamModel.$inferSelect;
type SubjectTypeRow = typeof subjectTypeModel.$inferSelect;

export async function toDto(
  meta: SubjectSelectionMetaRow,
): Promise<SubjectSelectionMetaDto> {
  const [[stream], [subjectType]] = await Promise.all([
    db.select().from(streamModel).where(eq(streamModel.id, meta.streamId)),
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, meta.subjectTypeId)),
  ]);

  const metaClasses = await db
    .select({
      id: subjectSelectionMetaClassModel.id,
      subjectSelectionMetaId:
        subjectSelectionMetaClassModel.subjectSelectionMetaId,
      classId: subjectSelectionMetaClassModel.classId,
      createdAt: subjectSelectionMetaClassModel.createdAt,
      updatedAt: subjectSelectionMetaClassModel.updatedAt,
      class: classModel,
    })
    .from(subjectSelectionMetaClassModel)
    .innerJoin(
      classModel,
      eq(subjectSelectionMetaClassModel.classId, classModel.id),
    )
    .where(eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id!));

  const forClasses: SubjectSelectionMetaClassDto[] = metaClasses.map(
    (row): SubjectSelectionMetaClassDto => ({
      id: row.id,
      subjectSelectionMetaId: row.subjectSelectionMetaId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      class: row.class as unknown as SubjectSelectionMetaClassDto["class"],
    }),
  );

  const dto: SubjectSelectionMetaDto = {
    id: meta.id,
    label: meta.label,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    stream: stream as unknown as SubjectSelectionMetaDto["stream"],
    subjectType:
      subjectType as unknown as SubjectSelectionMetaDto["subjectType"],
    forClasses,
  };
  return dto;
}

export async function findById(
  id: number,
): Promise<SubjectSelectionMetaDto | null> {
  const [meta] = await db
    .select()
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.id, id));
  if (!meta) return null;
  return await toDto(meta as SubjectSelectionMetaRow);
}

export async function findAll(): Promise<SubjectSelectionMetaDto[]> {
  const metas = await db.select().from(subjectSelectionMetaModel);
  const results: SubjectSelectionMetaDto[] = [];
  for (const m of metas) {
    results.push(await toDto(m as SubjectSelectionMetaRow));
  }
  return results;
}

export async function createFromDto(
  input: CreateSubjectSelectionMetaInput,
): Promise<SubjectSelectionMetaDto> {
  const [[stream], [subjectType]] = await Promise.all([
    db.select().from(streamModel).where(eq(streamModel.id, input.stream.id)),
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, input.subjectType.id)),
  ]);
  if (!stream) throw new Error(`Stream not found id=${input.stream.id}`);
  if (!subjectType)
    throw new Error(`SubjectType not found id=${input.subjectType.id}`);

  const [created] = await db
    .insert(subjectSelectionMetaModel)
    .values({
      label: input.label,
      streamId: input.stream.id,
      subjectTypeId: input.subjectType.id,
    })
    .returning();
  const createdRow = created as SubjectSelectionMetaRow;
  const metaId = createdRow.id as number;

  const classIds = (input.forClasses || [])
    .map((c) => c?.id)
    .filter((v): v is number => typeof v === "number");
  if (classIds.length > 0) {
    // Validate classes exist
    const rows = await db
      .select({ id: classModel.id })
      .from(classModel)
      .where(inArray(classModel.id, classIds));
    const validSet = new Set(rows.map((r) => r.id));
    const toInsert = classIds.filter((id) => validSet.has(id));
    if (toInsert.length > 0) {
      await db.insert(subjectSelectionMetaClassModel).values(
        toInsert.map((cid) => ({
          subjectSelectionMetaId: metaId,
          classId: cid,
        })),
      );
    }
  }

  const dto = await findById(metaId);
  if (!dto) throw new Error("Failed to create SubjectSelectionMeta");
  return dto;
}

export interface UpdateSubjectSelectionMetaInput {
  label?: string;
  stream?: { id: number };
  subjectType?: { id: number };
  forClasses?: { id: number }[];
}

export async function updateFromDto(
  id: number,
  input: UpdateSubjectSelectionMetaInput,
): Promise<SubjectSelectionMetaDto> {
  type SubjectSelectionMetaInsert =
    typeof subjectSelectionMetaModel.$inferInsert;
  const partial: Partial<SubjectSelectionMetaInsert> = {};
  if (typeof input.label === "string") partial.label = input.label;
  if (input.stream?.id) partial.streamId = input.stream.id as number;
  if (input.subjectType?.id)
    partial.subjectTypeId = input.subjectType.id as number;

  if (Object.keys(partial).length > 0) {
    await db
      .update(subjectSelectionMetaModel)
      .set(partial)
      .where(eq(subjectSelectionMetaModel.id, id));
  }

  if (Array.isArray(input.forClasses)) {
    const desiredIds = new Set(
      input.forClasses
        .map((c) => c?.id)
        .filter((v): v is number => typeof v === "number"),
    );

    const current = await db
      .select({
        id: subjectSelectionMetaClassModel.id,
        classId: subjectSelectionMetaClassModel.classId,
      })
      .from(subjectSelectionMetaClassModel)
      .where(eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, id));

    const currentIds = new Set(current.map((r) => r.classId));

    // Add missing
    for (const cid of desiredIds) {
      if (!currentIds.has(cid)) {
        await db.insert(subjectSelectionMetaClassModel).values({
          subjectSelectionMetaId: id,
          classId: cid,
        });
      }
    }

    // Remove extras
    for (const row of current) {
      if (!desiredIds.has(row.classId as number)) {
        await db
          .delete(subjectSelectionMetaClassModel)
          .where(eq(subjectSelectionMetaClassModel.id, row.id));
      }
    }
  }

  const dto = await findById(id);
  if (!dto) throw new Error("Failed to update SubjectSelectionMeta");
  return dto;
}

export async function remove(id: number): Promise<SubjectSelectionMetaDto> {
  // delete children first
  await db
    .delete(subjectSelectionMetaClassModel)
    .where(eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, id));

  const [deleted] = await db
    .delete(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.id, id))
    .returning();
  if (!deleted) throw new Error("SubjectSelectionMeta not found");
  // return deleted as DTO shape (without classes)
  // Better: reconstruct minimal DTO
  const [[stream], [subjectType]] = await Promise.all([
    db
      .select()
      .from(streamModel)
      .where(eq(streamModel.id, (deleted as SubjectSelectionMetaRow).streamId)),
    db
      .select()
      .from(subjectTypeModel)
      .where(
        eq(
          subjectTypeModel.id,
          (deleted as SubjectSelectionMetaRow).subjectTypeId,
        ),
      ),
  ]);
  const deletedRow = deleted as SubjectSelectionMetaRow;
  return {
    id: deletedRow.id,
    label: deletedRow.label,
    createdAt: deletedRow.createdAt,
    updatedAt: deletedRow.updatedAt,
    stream: stream as unknown as SubjectSelectionMetaDto["stream"],
    subjectType:
      subjectType as unknown as SubjectSelectionMetaDto["subjectType"],
    forClasses: [],
  } as SubjectSelectionMetaDto;
}
