import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  subjectSelectionMetaStreamModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  streamModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import {
  academicYearModel,
  classModel,
} from "@repo/db/schemas/models/academics";
import {
  SubjectSelectionMetaDto,
  SubjectSelectionMetaClassDto,
  SubjectSelectionMetaStreamDto,
} from "@repo/db/dtos/subject-selection";

// Use DTOs only for service I/O types per requirement

export interface CreateSubjectSelectionMetaInput {
  label: string;
  streams: { id: number }[];
  subjectType: { id: number };
  academicYear: { id: number };
  forClasses?: { id: number }[];
}

type SubjectSelectionMetaRow = typeof subjectSelectionMetaModel.$inferSelect;
type SubjectSelectionMetaClassRow =
  typeof subjectSelectionMetaClassModel.$inferSelect;
type SubjectSelectionMetaStreamRow =
  typeof subjectSelectionMetaStreamModel.$inferSelect;
type ClassRow = typeof classModel.$inferSelect;
type StreamRow = typeof streamModel.$inferSelect;
type SubjectTypeRow = typeof subjectTypeModel.$inferSelect;

export async function loadDefaultSubjectSelectionMetas() {
  const streams = await db.select().from(streamModel);
  const subjectTypes = await db.select().from(subjectTypeModel);
  const classes = await db.select().from(classModel);
  const academicYear = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.year, "2025-26"));

  for (const stream of streams) {
    for (const subjectType of subjectTypes) {
      // For Minor
      if (subjectType.code?.toUpperCase().trim() === "MN") {
        if (stream.name.toLowerCase().trim() === "commerce") {
          const semester3Class = classes.find(
            (c) => c.name.toUpperCase().trim() === "SEMESTER III",
          );
          await createFromInput({
            label: "Minor 3 (Semester III)",
            streams: [{ id: stream.id }],
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester3Class!.id }],
          });
        } else {
          // Minor 1 (Semester I & II)
          const semester1And2Classes = classes.filter(
            (c) =>
              c.name.toUpperCase().trim() === "SEMESTER I" ||
              c.name.toUpperCase().trim() === "SEMESTER II",
          );
          await createFromInput({
            label: "Minor 1 (Semester I & II)",
            streams: [{ id: stream.id }],
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: semester1And2Classes.map((c) => ({ id: c.id })),
          });
          // Minor 2 (Semester III & IV)
          const semester3And4Classes = classes.filter(
            (c) =>
              c.name.toUpperCase().trim() === "SEMESTER III" ||
              c.name.toUpperCase().trim() === "SEMESTER IV",
          );
          await createFromInput({
            label: "Minor 2 (Semester III & IV)",
            streams: [{ id: stream.id }],
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: semester3And4Classes.map((c) => ({ id: c.id })),
          });
        }
      }

      if (stream.name.toLowerCase().trim() === "commerce") continue;

      // For IDC
      if (subjectType.code?.toUpperCase().trim() === "IDC") {
        const semester1Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER I",
        );
        const semester2Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER II",
        );
        const semester3Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER III",
        );
        await createFromInput({
          label: "IDC 1 (Semester I)",
          streams: [{ id: stream.id }],
          subjectType: { id: subjectType.id },
          academicYear: { id: academicYear[0].id },
          forClasses: [{ id: semester1Class!.id }],
        });
        await createFromInput({
          label: "IDC 2 (Semester II)",
          streams: [{ id: stream.id }],
          subjectType: { id: subjectType.id },
          academicYear: { id: academicYear[0].id },
          forClasses: [{ id: semester2Class!.id }],
        });
        await createFromInput({
          label: "IDC 3 (Semester III)",
          streams: [{ id: stream.id }],
          subjectType: { id: subjectType.id },
          academicYear: { id: academicYear[0].id },
          forClasses: [{ id: semester3Class!.id }],
        });
      }

      // For AEC
      if (subjectType.code?.toUpperCase().trim() === "AEC") {
        const semester3Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER III",
        );
        const semester4Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER IV",
        );

        await createFromInput({
          label: "AEC (Semester III & IV)",
          streams: [{ id: stream.id }],
          subjectType: { id: subjectType.id },
          academicYear: { id: academicYear[0].id },
          forClasses: [{ id: semester3Class!.id }, { id: semester4Class!.id }],
        });
      }

      // For CVAC
      if (subjectType.code?.toUpperCase().trim() === "CVAC") {
        const semester2Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER II",
        );
        await createFromInput({
          label: "CVAC 4 (Semester II)",
          streams: [{ id: stream.id }],
          subjectType: { id: subjectType.id },
          academicYear: { id: academicYear[0].id },
          forClasses: [{ id: semester2Class!.id }],
        });
      }
    }
  }
}

export async function toDto(
  meta: SubjectSelectionMetaRow,
): Promise<SubjectSelectionMetaDto> {
  const [subjectType, academicYear] = await Promise.all([
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, meta.subjectTypeId)),
    db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, meta.academicYearId)),
  ]);

  // Get streams through the many-to-many relationship
  const metaStreams = await db
    .select({
      id: subjectSelectionMetaStreamModel.id,
      subjectSelectionMetaId:
        subjectSelectionMetaStreamModel.subjectSelectionMetaId,
      streamId: subjectSelectionMetaStreamModel.streamId,
      createdAt: subjectSelectionMetaStreamModel.createdAt,
      updatedAt: subjectSelectionMetaStreamModel.updatedAt,
      stream: streamModel,
    })
    .from(subjectSelectionMetaStreamModel)
    .innerJoin(
      streamModel,
      eq(subjectSelectionMetaStreamModel.streamId, streamModel.id),
    )
    .where(
      eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, meta.id!),
    );

  const streams: SubjectSelectionMetaStreamDto[] = metaStreams.map(
    (row): SubjectSelectionMetaStreamDto => ({
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      stream: row.stream as unknown as SubjectSelectionMetaStreamDto["stream"],
    }),
  );

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
    streams,
    subjectType:
      subjectType as unknown as SubjectSelectionMetaDto["subjectType"],
    academicYear:
      academicYear as unknown as SubjectSelectionMetaDto["academicYear"],
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

export async function createFromInput(
  input: CreateSubjectSelectionMetaInput,
): Promise<SubjectSelectionMetaDto | null> {
  if (!input.subjectType?.id || !input.academicYear?.id) {
    return null;
  }

  const [subjectType, academicYear] = await Promise.all([
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, input.subjectType.id)),
    db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, input.academicYear.id)),
  ]);

  if (!subjectType || !academicYear) {
    return null;
  }

  const [created] = await db
    .insert(subjectSelectionMetaModel)
    .values({
      label: input.label,
      subjectTypeId: input.subjectType.id,
      academicYearId: input.academicYear.id,
    })
    .returning();
  const createdRow = created as SubjectSelectionMetaRow;
  const metaId = createdRow.id as number;

  // Create stream relationships
  const streamIds = input.streams
    .map((s) => s?.id)
    .filter((v): v is number => typeof v === "number");
  if (streamIds.length > 0) {
    // Validate streams exist
    const rows = await db
      .select({ id: streamModel.id })
      .from(streamModel)
      .where(inArray(streamModel.id, streamIds));
    const validSet = new Set(rows.map((r) => r.id));
    const toInsert = streamIds.filter((id) => validSet.has(id));
    if (toInsert.length > 0) {
      await db.insert(subjectSelectionMetaStreamModel).values(
        toInsert.map((sid) => ({
          subjectSelectionMetaId: metaId,
          streamId: sid,
        })),
      );
    }
  }

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
  return dto;
}

export async function createFromDto(
  input: SubjectSelectionMetaDto,
): Promise<SubjectSelectionMetaDto | null> {
  if (!input.subjectType?.id || !input.academicYear?.id) {
    return null;
  }

  const [subjectType, academicYear] = await Promise.all([
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, input.subjectType.id)),
    db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, input.academicYear.id)),
  ]);

  if (!subjectType || !academicYear) {
    return null;
  }

  const [created] = await db
    .insert(subjectSelectionMetaModel)
    .values({
      label: input.label,
      subjectTypeId: input.subjectType.id,
      academicYearId: input.academicYear.id,
    })
    .returning();
  const createdRow = created as SubjectSelectionMetaRow;
  const metaId = createdRow.id as number;

  // Create stream relationships
  const streamIds = input.streams
    .map((s) => s?.id)
    .filter((v): v is number => typeof v === "number");
  if (streamIds.length > 0) {
    // Validate streams exist
    const rows = await db
      .select({ id: streamModel.id })
      .from(streamModel)
      .where(inArray(streamModel.id, streamIds));
    const validSet = new Set(rows.map((r) => r.id));
    const toInsert = streamIds.filter((id) => validSet.has(id));
    if (toInsert.length > 0) {
      await db.insert(subjectSelectionMetaStreamModel).values(
        toInsert.map((sid) => ({
          subjectSelectionMetaId: metaId,
          streamId: sid,
        })),
      );
    }
  }

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
  return dto;
}

export interface UpdateSubjectSelectionMetaInput {
  label?: string;
  streams?: { id: number }[];
  subjectType?: { id: number };
  academicYear?: { id: number };
  forClasses?: { id: number }[];
}

export async function updateFromDto(
  id: number,
  input: UpdateSubjectSelectionMetaInput,
): Promise<SubjectSelectionMetaDto | null> {
  type SubjectSelectionMetaInsert =
    typeof subjectSelectionMetaModel.$inferInsert;
  const partial: Partial<SubjectSelectionMetaInsert> = {};
  if (typeof input.label === "string") partial.label = input.label;
  if (input.subjectType?.id)
    partial.subjectTypeId = input.subjectType.id as number;
  if (input.academicYear?.id)
    partial.academicYearId = input.academicYear.id as number;

  if (Object.keys(partial).length > 0) {
    await db
      .update(subjectSelectionMetaModel)
      .set(partial)
      .where(eq(subjectSelectionMetaModel.id, id));
  }

  // Update streams if provided
  if (Array.isArray(input.streams)) {
    const desiredIds = new Set(
      input.streams
        .map((s) => s?.id)
        .filter((v): v is number => typeof v === "number"),
    );

    const current = await db
      .select({
        id: subjectSelectionMetaStreamModel.id,
        streamId: subjectSelectionMetaStreamModel.streamId,
      })
      .from(subjectSelectionMetaStreamModel)
      .where(eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, id));

    const currentIds = new Set(current.map((r) => r.streamId));

    // Add missing
    for (const sid of desiredIds) {
      if (!currentIds.has(sid)) {
        await db.insert(subjectSelectionMetaStreamModel).values({
          subjectSelectionMetaId: id,
          streamId: sid,
        });
      }
    }

    // Remove extras
    for (const row of current) {
      if (!desiredIds.has(row.streamId as number)) {
        await db
          .delete(subjectSelectionMetaStreamModel)
          .where(eq(subjectSelectionMetaStreamModel.id, row.id));
      }
    }
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
  return dto;
}

export async function remove(
  id: number,
): Promise<SubjectSelectionMetaDto | null> {
  // delete children first
  await db
    .delete(subjectSelectionMetaClassModel)
    .where(eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, id));

  await db
    .delete(subjectSelectionMetaStreamModel)
    .where(eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, id));

  const [deleted] = await db
    .delete(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.id, id))
    .returning();
  if (!deleted) return null;

  const [subjectType, academicYear] = await Promise.all([
    db
      .select()
      .from(subjectTypeModel)
      .where(
        eq(
          subjectTypeModel.id,
          (deleted as SubjectSelectionMetaRow).subjectTypeId,
        ),
      ),
    db
      .select()
      .from(academicYearModel)
      .where(
        eq(
          academicYearModel.id,
          (deleted as SubjectSelectionMetaRow).academicYearId,
        ),
      ),
  ]);
  const deletedRow = deleted as SubjectSelectionMetaRow;
  return {
    id: deletedRow.id,
    label: deletedRow.label,
    createdAt: deletedRow.createdAt,
    updatedAt: deletedRow.updatedAt,
    streams: [],
    subjectType:
      subjectType as unknown as SubjectSelectionMetaDto["subjectType"],
    academicYear:
      academicYear as unknown as SubjectSelectionMetaDto["academicYear"],
    forClasses: [],
  } as SubjectSelectionMetaDto;
}
