import { db } from "@/db/index.js";
import {
  certificateFieldOptionMasterModel,
  createCertificateFieldOptionMasterSchema,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";

export type CertificateFieldOptionRow =
  typeof certificateFieldOptionMasterModel.$inferSelect;

export async function findOptionsByFieldMasterId(
  certificateFieldMasterId: number,
): Promise<CertificateFieldOptionRow[]> {
  return db
    .select()
    .from(certificateFieldOptionMasterModel)
    .where(
      eq(
        certificateFieldOptionMasterModel.certificateFieldMasterId,
        certificateFieldMasterId,
      ),
    )
    .orderBy(asc(certificateFieldOptionMasterModel.sequence));
}

export async function findCertificateFieldOptionById(
  id: number,
): Promise<CertificateFieldOptionRow | null> {
  const [row] = await db
    .select()
    .from(certificateFieldOptionMasterModel)
    .where(eq(certificateFieldOptionMasterModel.id, id));

  return row ?? null;
}

export async function createCertificateFieldOption(
  data: typeof createCertificateFieldOptionMasterSchema._type,
): Promise<CertificateFieldOptionRow | null> {
  const [created] = await db
    .insert(certificateFieldOptionMasterModel)
    .values(data)
    .returning();

  return created ?? null;
}

export async function updateCertificateFieldOption(
  id: number,
  data: Partial<typeof createCertificateFieldOptionMasterSchema._type>,
): Promise<CertificateFieldOptionRow | null> {
  const [existing] = await db
    .select()
    .from(certificateFieldOptionMasterModel)
    .where(eq(certificateFieldOptionMasterModel.id, id));

  if (!existing) return null;

  const [updated] = await db
    .update(certificateFieldOptionMasterModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(certificateFieldOptionMasterModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteCertificateFieldOption(
  id: number,
): Promise<boolean> {
  const deleted = await db
    .delete(certificateFieldOptionMasterModel)
    .where(eq(certificateFieldOptionMasterModel.id, id))
    .returning({ id: certificateFieldOptionMasterModel.id });

  return deleted.length > 0;
}
