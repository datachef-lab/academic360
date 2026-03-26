import { db } from "@/db/index.js";
import {
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  certificateMasterModel,
} from "@repo/db/schemas";
import { and, asc, eq } from "drizzle-orm";
import type { CertificateMasterDto } from "@repo/db/dtos";
import { defaultCertificateMasterData } from "@/features/academics/default-certificate-master-data.js";

export async function loadDefaultCertificateMasters(): Promise<void> {
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
