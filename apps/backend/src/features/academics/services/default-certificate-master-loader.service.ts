import { db } from "@/db/index.js";
import {
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  certificateMasterModel,
} from "@repo/db/schemas";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { CertificateMasterDto } from "@repo/db/dtos";
import { defaultCertificateMasterData } from "@/features/academics/default-certificate-master-data.js";

/** Rename legacy combined master and align field sequences with the Internship template. */
async function migrateLegacyWorkExperienceInternshipSplit(): Promise<void> {
  const [legacy] = await db
    .select()
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.name, "Work Experience / Internships"))
    .limit(1);

  if (!legacy) return;

  const internTemplate = defaultCertificateMasterData.find(
    (m) => m.name === "Internship",
  );
  if (!internTemplate) return;

  await db
    .update(certificateMasterModel)
    .set({
      name: internTemplate.name,
      description: internTemplate.description,
      color: internTemplate.color ?? null,
      bgColor: internTemplate.bgColor ?? null,
      sequence: internTemplate.sequence,
    })
    .where(eq(certificateMasterModel.id, legacy.id));

  const fieldRows = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.certificateMasterId, legacy.id));

  for (const tf of internTemplate.fields) {
    const row = fieldRows.find((r) => r.name === tf.name);
    if (!row) continue;
    await db
      .update(certificateFieldMasterModel)
      .set({
        sequence: tf.sequence,
        isQuestion: Boolean(tf.isQuestion),
        isRequired: Boolean(tf.isRequired),
      })
      .where(eq(certificateFieldMasterModel.id, row.id));
  }
}

const MANDATORY_INTERNSHIP_SEMESTER_QUESTION =
  "In which semester are you planning to pursue your mandatory internship?";

/** Arabic-numeral labels that duplicate II / IV / VI; keep rows for FK integrity but hide from selects. */
const LEGACY_ARABIC_INTERNSHIP_SEMESTER_OPTION_NAMES = [
  "Semester 2",
  "Semester 4",
  "Semester 6",
] as const;

async function deactivateLegacyArabicInternshipSemesterOptions(): Promise<void> {
  const [internMaster] = await db
    .select({ id: certificateMasterModel.id })
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.name, "Internship"))
    .limit(1);

  if (!internMaster) return;

  const [questionField] = await db
    .select({ id: certificateFieldMasterModel.id })
    .from(certificateFieldMasterModel)
    .where(
      and(
        eq(certificateFieldMasterModel.certificateMasterId, internMaster.id),
        eq(
          certificateFieldMasterModel.name,
          MANDATORY_INTERNSHIP_SEMESTER_QUESTION,
        ),
      ),
    )
    .limit(1);

  if (!questionField) return;

  await db
    .update(certificateFieldOptionMasterModel)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(
          certificateFieldOptionMasterModel.certificateFieldMasterId,
          questionField.id,
        ),
        inArray(certificateFieldOptionMasterModel.name, [
          ...LEGACY_ARABIC_INTERNSHIP_SEMESTER_OPTION_NAMES,
        ]),
      ),
    );
}

export async function loadDefaultCertificateMasters(): Promise<void> {
  await migrateLegacyWorkExperienceInternshipSplit();

  for (const master of defaultCertificateMasterData) {
    const [existing] = await db
      .select()
      .from(certificateMasterModel)
      .where(eq(certificateMasterModel.name, master.name));

    const certificateMaster =
      existing ??
      (
        await db
          .insert(certificateMasterModel)
          .values({
            name: master.name,
            description: master.description,
            color: master.color ?? null,
            bgColor: master.bgColor ?? null,
            sequence: master.sequence,
            isActive: true,
          })
          .returning()
      )[0];

    if (!certificateMaster) continue;

    // Seed field masters + options (idempotent by (certificateMasterId, name))
    for (const field of master.fields) {
      const existingFields = await db
        .select()
        .from(certificateFieldMasterModel)
        .where(
          eq(
            certificateFieldMasterModel.certificateMasterId,
            certificateMaster.id,
          ),
        );

      const existingField = existingFields.find((r) => r.name === field.name);

      const fieldMaster =
        existingField ??
        (
          await db
            .insert(certificateFieldMasterModel)
            .values({
              certificateMasterId: certificateMaster.id,
              name: field.name,
              type: field.type as any,
              isQuestion: Boolean(field.isQuestion),
              isRequired: Boolean(field.isRequired),
              sequence: field.sequence,
              isActive: true,
            })
            .returning()
        )[0];

      if (!fieldMaster) continue;

      for (const opt of field.options ?? []) {
        const existingOpts = await db
          .select()
          .from(certificateFieldOptionMasterModel)
          .where(
            eq(
              certificateFieldOptionMasterModel.certificateFieldMasterId,
              fieldMaster.id,
            ),
          );

        const existingOpt = existingOpts.find((r) => r.name === opt.name);

        if (existingOpt) continue;

        await db.insert(certificateFieldOptionMasterModel).values({
          certificateFieldMasterId: fieldMaster.id,
          name: opt.name,
          sequence: opt.sequence,
          isActive: true,
        });
      }
    }
  }

  await deactivateLegacyArabicInternshipSemesterOptions();
}

export async function listCertificateMastersWithFields(): Promise<
  CertificateMasterDto[]
> {
  const masters = await db
    .select()
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.isActive, true))
    .orderBy(asc(certificateMasterModel.sequence));

  const dtos: CertificateMasterDto[] = [];

  for (const m of masters) {
    const fieldRows = await db
      .select()
      .from(certificateFieldMasterModel)
      .where(
        and(
          eq(certificateFieldMasterModel.certificateMasterId, m.id),
          eq(certificateFieldMasterModel.isActive, true),
        ),
      )
      .orderBy(asc(certificateFieldMasterModel.sequence));

    const fields = await Promise.all(
      fieldRows.map(async (fm) => {
        const options = await db
          .select()
          .from(certificateFieldOptionMasterModel)
          .where(
            and(
              eq(
                certificateFieldOptionMasterModel.certificateFieldMasterId,
                fm.id,
              ),
              eq(certificateFieldOptionMasterModel.isActive, true),
            ),
          )
          .orderBy(asc(certificateFieldOptionMasterModel.sequence));

        return { ...fm, options };
      }),
    );

    dtos.push({
      ...m,
      fields,
    } as any);
  }

  return dtos;
}
