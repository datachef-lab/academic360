import { db } from "@/db/index.js";
import {
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  certificateMasterModel,
  createCertificateMasterSchema,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";

export type CertificateMasterRow = typeof certificateMasterModel.$inferSelect;

export async function findAllCertificateMasters(): Promise<
  CertificateMasterRow[]
> {
  return db
    .select()
    .from(certificateMasterModel)
    .orderBy(
      asc(certificateMasterModel.sequence),
      asc(certificateMasterModel.id),
    );
}

export async function findCertificateMasterById(
  id: number,
): Promise<CertificateMasterRow | null> {
  const [row] = await db
    .select()
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.id, id));

  return row ?? null;
}

export async function createCertificateMaster(
  data: typeof createCertificateMasterSchema._type,
): Promise<CertificateMasterRow | null> {
  const [created] = await db
    .insert(certificateMasterModel)
    .values(data)
    .returning();

  return created ?? null;
}

export async function updateCertificateMaster(
  id: number,
  data: Partial<typeof createCertificateMasterSchema._type>,
): Promise<CertificateMasterRow | null> {
  const [existing] = await db
    .select()
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.id, id));

  if (!existing) return null;

  const [updated] = await db
    .update(certificateMasterModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(certificateMasterModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteCertificateMaster(id: number): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(certificateMasterModel)
    .where(eq(certificateMasterModel.id, id));

  if (!existing) return false;

  const fields = await db
    .select({ id: certificateFieldMasterModel.id })
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.certificateMasterId, id));

  for (const f of fields) {
    await db
      .delete(certificateFieldOptionMasterModel)
      .where(
        eq(certificateFieldOptionMasterModel.certificateFieldMasterId, f.id),
      );
  }

  await db
    .delete(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.certificateMasterId, id));

  const deleted = await db
    .delete(certificateMasterModel)
    .where(eq(certificateMasterModel.id, id))
    .returning({ id: certificateMasterModel.id });

  return deleted.length > 0;
}
