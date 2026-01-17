import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  subjectSelectionMetaStreamModel,
  studentSubjectSelectionModel,
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
  sequence: number;
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

// Helper function to check if a meta already exists
async function metaExists(
  label: string,
  subjectTypeId: number,
  academicYearId: number,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(subjectSelectionMetaModel)
    .where(
      and(
        eq(subjectSelectionMetaModel.label, label),
        eq(subjectSelectionMetaModel.subjectTypeId, subjectTypeId),
        eq(subjectSelectionMetaModel.academicYearId, academicYearId),
      ),
    );

  return existing.length > 0;
}

// Helper function to check if a meta-class relationship already exists
async function metaClassExists(
  metaId: number,
  classId: number,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(subjectSelectionMetaClassModel)
    .where(
      and(
        eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, metaId),
        eq(subjectSelectionMetaClassModel.classId, classId),
      ),
    );

  return existing.length > 0;
}

// Helper function to check if a meta-stream relationship already exists
async function metaStreamExists(
  metaId: number,
  streamId: number,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(subjectSelectionMetaStreamModel)
    .where(
      and(
        eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, metaId),
        eq(subjectSelectionMetaStreamModel.streamId, streamId),
      ),
    );

  return existing.length > 0;
}

export async function loadDefaultSubjectSelectionMetas() {
  // console.log("loading default subject-selection-meta");

  const academicYear = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.year, "2025-26"));

  if (!academicYear[0]) {
    console.log("Academic year 2025-26 not found, skipping meta creation");
    return;
  }

  // console.log("Creating default metas with proper duplicate checking...");

  const streams = await db.select().from(streamModel);
  const subjectTypes = await db.select().from(subjectTypeModel);
  const classes = await db.select().from(classModel);

  console.log(
    `Found ${streams.length} streams, ${subjectTypes.length} subject types, ${classes.length} classes`,
  );

  // Create metas by subject type, not by stream
  for (const subjectType of subjectTypes) {
    // For Minor
    if (subjectType.code?.toUpperCase().trim() === "MN") {
      // Minor 3 (Semester III) - Only for Commerce
      const commerceStream = streams.find(
        (s) => s.name.toLowerCase().trim() === "commerce",
      );
      if (commerceStream) {
        const semester3Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER III",
        );

        const exists = await metaExists(
          "Minor 3 (Semester III)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists) {
          // console.log(
          //   `Creating Minor 3 (Semester III) for Commerce stream and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "Minor 3 (Semester III)",
            sequence: 3,
            streams: [{ id: commerceStream.id }],
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester3Class!.id }],
          });
        } else {
          // console.log(
          //   `Minor 3 (Semester III) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }
      }

      // Minor 1 (Semester I & II) - For all streams except Commerce
      const nonCommerceStreams = streams.filter(
        (s) => s.name.toLowerCase().trim() !== "commerce",
      );
      if (nonCommerceStreams.length > 0) {
        const semester1And2Classes = classes.filter(
          (c) =>
            c.name.toUpperCase().trim() === "SEMESTER I" ||
            c.name.toUpperCase().trim() === "SEMESTER II",
        );

        const exists1 = await metaExists(
          "Minor 1 (Semester I & II)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists1) {
          // console.log(
          //   `Creating Minor 1 (Semester I & II) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "Minor 1 (Semester I & II)",
            sequence: 1,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: semester1And2Classes.map((c) => ({ id: c.id })),
          });
        } else {
          // console.log(
          //   `Minor 1 (Semester I & II) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }

        // Minor 2 (Semester III & IV) - For all streams except Commerce
        const semester3And4Classes = classes.filter(
          (c) =>
            c.name.toUpperCase().trim() === "SEMESTER III" ||
            c.name.toUpperCase().trim() === "SEMESTER IV",
        );

        const exists2 = await metaExists(
          "Minor 2 (Semester III & IV)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists2) {
          // console.log(
          //   `Creating Minor 2 (Semester III & IV) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "Minor 2 (Semester III & IV)",
            sequence: 2,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: semester3And4Classes.map((c) => ({ id: c.id })),
          });
        } else {
          // console.log(
          //   `Minor 2 (Semester III & IV) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }
      }
    }

    // For IDC - Only for non-commerce streams
    if (subjectType.code?.toUpperCase().trim() === "IDC") {
      const nonCommerceStreams = streams.filter(
        (s) => s.name.toLowerCase().trim() !== "commerce",
      );
      if (nonCommerceStreams.length > 0) {
        const semester1Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER I",
        );
        const semester2Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER II",
        );
        const semester3Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER III",
        );

        const exists1 = await metaExists(
          "IDC 1 (Semester I)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists1) {
          // console.log(
          //   `Creating IDC 1 (Semester I) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "IDC 1 (Semester I)",
            sequence: 4,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester1Class!.id }],
          });
        } else {
          // console.log(
          //   `IDC 1 (Semester I) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }

        const exists2 = await metaExists(
          "IDC 2 (Semester II)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists2) {
          // console.log(
          //   `Creating IDC 2 (Semester II) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "IDC 2 (Semester II)",
            sequence: 5,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester2Class!.id }],
          });
        } else {
          // console.log(
          //   `IDC 2 (Semester II) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }

        const exists3 = await metaExists(
          "IDC 3 (Semester III)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists3) {
          // console.log(
          //   `Creating IDC 3 (Semester III) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "IDC 3 (Semester III)",
            sequence: 6,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester3Class!.id }],
          });
        } else {
          // console.log(
          //   `IDC 3 (Semester III) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }
      }
    }

    // For AEC - Only for non-commerce streams
    if (subjectType.code?.toUpperCase().trim() === "AEC") {
      const nonCommerceStreams = streams.filter(
        (s) => s.name.toLowerCase().trim() !== "commerce",
      );
      if (nonCommerceStreams.length > 0) {
        const semester3Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER III",
        );
        const semester4Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER IV",
        );

        const exists = await metaExists(
          "AEC (Semester III & IV)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists) {
          // console.log(
          //   `Creating AEC (Semester III & IV) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "AEC (Semester III & IV)",
            sequence: 7,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [
              { id: semester3Class!.id },
              { id: semester4Class!.id },
            ],
          });
        } else {
          // console.log(
          //   `AEC (Semester III & IV) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }
      }
    }

    // For CVAC - Only for non-commerce streams
    if (subjectType.code?.toUpperCase().trim() === "CVAC") {
      const nonCommerceStreams = streams.filter(
        (s) => s.name.toLowerCase().trim() !== "commerce",
      );
      if (nonCommerceStreams.length > 0) {
        const semester2Class = classes.find(
          (c) => c.name.toUpperCase().trim() === "SEMESTER II",
        );

        const exists = await metaExists(
          "CVAC 4 (Semester II)",
          subjectType.id,
          academicYear[0].id,
        );
        if (!exists) {
          // console.log(
          //   `Creating CVAC 4 (Semester II) for non-commerce streams and subject type ${subjectType.code}`,
          // );
          await createOrUpdateMetaWithRelations({
            label: "CVAC 4 (Semester II)",
            sequence: 8,
            streams: nonCommerceStreams.map((s) => ({ id: s.id })),
            subjectType: { id: subjectType.id },
            academicYear: { id: academicYear[0].id },
            forClasses: [{ id: semester2Class!.id }],
          });
        } else {
          // console.log(
          //   `CVAC 4 (Semester II) already exists for subject type ${subjectType.code}, skipping`,
          // );
        }
      }
    }
  }
  console.log("Default subject selection metas creation completed");
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

// Function to create or update meta with streams and classes
export async function createOrUpdateMetaWithRelations(
  input: CreateSubjectSelectionMetaInput,
): Promise<SubjectSelectionMetaDto | null> {
  if (!input.subjectType?.id || !input.academicYear?.id) {
    return null;
  }

  // Check if meta already exists
  const existingMeta = await db
    .select()
    .from(subjectSelectionMetaModel)
    .where(
      and(
        eq(subjectSelectionMetaModel.label, input.label),
        eq(subjectSelectionMetaModel.subjectTypeId, input.subjectType.id),
        eq(subjectSelectionMetaModel.academicYearId, input.academicYear.id),
      ),
    );

  let metaId: number;

  if (existingMeta.length > 0) {
    // Use existing meta
    metaId = existingMeta[0].id;
    console.log(
      `Using existing meta with ID ${metaId} for label "${input.label}"`,
    );
  } else {
    // Create new meta
    const [created] = await db
      .insert(subjectSelectionMetaModel)
      .values({
        label: input.label,
        subjectTypeId: input.subjectType.id,
        academicYearId: input.academicYear.id,
      })
      .returning();
    metaId = created.id;
    console.log(
      `Created new meta with ID ${metaId} for label "${input.label}"`,
    );
  }

  // Create stream relationships (with duplicate checking)
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

    // Check for existing stream relationships and only insert new ones
    for (const streamId of toInsert) {
      const exists = await metaStreamExists(metaId, streamId);
      if (!exists) {
        await db.insert(subjectSelectionMetaStreamModel).values({
          subjectSelectionMetaId: metaId,
          streamId: streamId,
        });
        console.log(`Added stream ${streamId} to meta ${metaId}`);
      } else {
        console.log(
          `Stream ${streamId} already exists for meta ${metaId}, skipping`,
        );
      }
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
    // Check for existing class relationships and only insert new ones
    for (const classId of toInsert) {
      const exists = await metaClassExists(metaId, classId);
      if (!exists) {
        await db.insert(subjectSelectionMetaClassModel).values({
          subjectSelectionMetaId: metaId,
          classId: classId,
        });
        console.log(`Added class ${classId} to meta ${metaId}`);
      } else {
        console.log(
          `Class ${classId} already exists for meta ${metaId}, skipping`,
        );
      }
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
